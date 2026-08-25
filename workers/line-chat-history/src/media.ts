import type { Env, MediaQueueMessage } from './types';

const LINE_DATA_API = 'https://api-data.line.me/v2/bot';
const LINE_API = 'https://api.line.me/v2/bot';

// Must match queues.consumers[0].max_retries in wrangler.jsonc — used to decide
// when a failing attachment should be marked "failed" in D1 instead of silently
// riding retries into the DLQ (where /chat-history/health can no longer see it).
const MAX_QUEUE_ATTEMPTS = 5;

function lineAuthHeaders(env: Env): HeadersInit {
  return { Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` };
}

export async function processMediaQueueBatch(
  batch: MessageBatch<MediaQueueMessage>,
  env: Env,
): Promise<void> {
  for (const message of batch.messages) {
    try {
      if (message.body.kind === 'attachment') {
        await processAttachment(message.body.messageId, message.body.attachmentKind, env);
      } else {
        await processProfile(message.body.conversationId, message.body.lineUserId, env);
      }
      message.ack();
    } catch (error) {
      console.error('media queue message failed', message.body, error);

      if (message.body.kind === 'attachment') {
        const isFinalAttempt = message.attempts >= MAX_QUEUE_ATTEMPTS;
        await recordAttachmentAttemptFailure(
          env,
          message.body.messageId,
          error instanceof Error ? error.message : String(error),
          isFinalAttempt,
        ).catch((dbError) => console.error('failed to record attachment failure', dbError));
      }

      // Let Cloudflare's retry/backoff + configured max_retries handle transient
      // failures; after max_retries the message lands on the DLQ.
      message.retry();
    }
  }
}

async function recordAttachmentAttemptFailure(
  env: Env,
  messageId: string,
  errorMessage: string,
  isFinalAttempt: boolean,
): Promise<void> {
  if (isFinalAttempt) {
    await markAttachment(env, messageId, { status: 'failed', last_error: errorMessage, attempts: MAX_QUEUE_ATTEMPTS });
    return;
  }
  await env.CHAT_DB.prepare(`UPDATE attachments SET attempts = attempts + 1, last_error = ? WHERE message_id = ?`)
    .bind(errorMessage, messageId)
    .run();
}

async function markAttachment(
  env: Env,
  messageId: string,
  fields: Record<string, string | number | null>,
): Promise<void> {
  const setClauses = Object.keys(fields)
    .map((key) => `${key} = ?`)
    .join(', ');
  await env.CHAT_DB.prepare(`UPDATE attachments SET ${setClauses} WHERE message_id = ?`)
    .bind(...Object.values(fields), messageId)
    .run();
  await env.CHAT_DB.prepare(`UPDATE messages SET media_status = ? WHERE message_id = ?`)
    .bind(fields.status, messageId)
    .run();
}

async function processAttachment(
  messageId: string,
  attachmentKind: 'image' | 'video' | 'audio' | 'file',
  env: Env,
): Promise<void> {
  if (attachmentKind === 'video' || attachmentKind === 'audio') {
    const transcodingRes = await fetch(`${LINE_DATA_API}/message/${messageId}/content/transcoding`, {
      headers: lineAuthHeaders(env),
    });
    if (transcodingRes.status === 200) {
      const { status } = await transcodingRes.json<{ status: string }>();
      if (status === 'processing') {
        throw new Error('transcoding still processing'); // triggers retry via backoff
      }
      if (status === 'failed') {
        await markAttachment(env, messageId, { status: 'failed', last_error: 'line transcoding failed' });
        return;
      }
    }
  }

  const contentRes = await fetch(`${LINE_DATA_API}/message/${messageId}/content`, {
    headers: lineAuthHeaders(env),
  });

  if (contentRes.status === 404 || contentRes.status === 410) {
    await markAttachment(env, messageId, { status: 'expired', last_error: `content ${contentRes.status}` });
    return;
  }
  if (!contentRes.ok) {
    throw new Error(`content fetch failed: ${contentRes.status}`);
  }

  const maxBytes = Number(env.MEDIA_MAX_BYTES);
  const declaredLength = Number(contentRes.headers.get('content-length') ?? 0);
  if (declaredLength > maxBytes) {
    await markAttachment(env, messageId, {
      status: 'too_large',
      byte_size: declaredLength,
      content_type: contentRes.headers.get('content-type'),
    });
    return;
  }

  const bodyBuffer = await contentRes.arrayBuffer();
  if (bodyBuffer.byteLength > maxBytes) {
    await markAttachment(env, messageId, {
      status: 'too_large',
      byte_size: bodyBuffer.byteLength,
      content_type: contentRes.headers.get('content-type'),
    });
    return;
  }

  const conversationRow = await env.CHAT_DB.prepare(
    `SELECT conversation_id, occurred_at FROM messages WHERE message_id = ?`,
  )
    .bind(messageId)
    .first<{ conversation_id: string; occurred_at: number }>();

  const contentType = contentRes.headers.get('content-type') ?? 'application/octet-stream';
  const ext = extensionForContentType(contentType);
  const date = new Date(conversationRow?.occurred_at ?? Date.now());
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const conversationPath = conversationRow?.conversation_id ?? 'unknown';
  const r2Key = `line/${conversationPath}/${yyyy}/${mm}/${messageId}${ext}`;

  const digest = await crypto.subtle.digest('SHA-256', bodyBuffer);
  const sha256 = bytesToHex(new Uint8Array(digest));

  await env.CHAT_MEDIA.put(r2Key, bodyBuffer, { httpMetadata: { contentType } });

  let previewR2Key: string | null = null;
  if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
    const previewRes = await fetch(`${LINE_DATA_API}/message/${messageId}/content/preview`, {
      headers: lineAuthHeaders(env),
    });
    if (previewRes.ok) {
      const previewBuffer = await previewRes.arrayBuffer();
      previewR2Key = `line/${conversationPath}/${yyyy}/${mm}/${messageId}-preview.jpg`;
      await env.CHAT_MEDIA.put(previewR2Key, previewBuffer, {
        httpMetadata: { contentType: previewRes.headers.get('content-type') ?? 'image/jpeg' },
      });
    }
  }

  await markAttachment(env, messageId, {
    status: 'stored',
    r2_key: r2Key,
    preview_r2_key: previewR2Key,
    content_type: contentType,
    byte_size: bodyBuffer.byteLength,
    sha256,
    fetched_at: Date.now(),
  });
}

async function processProfile(conversationId: string, lineUserId: string, env: Env): Promise<void> {
  const res = await fetch(`${LINE_API}/profile/${lineUserId}`, { headers: lineAuthHeaders(env) });
  if (!res.ok) {
    if (res.status === 404) return; // user blocked the OA or profile unavailable — not fatal
    throw new Error(`profile fetch failed: ${res.status}`);
  }
  const profile = await res.json<{ displayName: string; pictureUrl?: string }>();
  await env.CHAT_DB.prepare(
    `UPDATE conversations SET display_name = ?, picture_url = ?, profile_fetched_at = ? WHERE conversation_id = ?`,
  )
    .bind(profile.displayName, profile.pictureUrl ?? null, Date.now(), conversationId)
    .run();
}

function extensionForContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'audio/m4a': '.m4a',
    'audio/x-m4a': '.m4a',
    'application/pdf': '.pdf',
  };
  return map[contentType] ?? '';
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
