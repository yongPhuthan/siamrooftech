import { errorResponse, jsonResponse } from './http';
import type { Env } from './types';

const LINE_API = 'https://api.line.me/v2/bot/message';
const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

interface LineSendResult {
  method: 'reply' | 'push';
  providerMessageId: string;
  response: unknown;
}

interface PreparedOutbound {
  lineMessage: Record<string, unknown>;
  type: 'text' | 'image';
  text: string | null;
  media?: {
    token: string;
    originalKey: string;
    previewKey: string;
    original: UploadImage;
    preview: UploadImage;
  };
}

interface UploadImage {
  type: string;
  size: number;
  stream(): ReadableStream;
}

class UnknownDeliveryError extends Error {}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function prepareOutbound(request: Request, env: Env, origin: string): Promise<PreparedOutbound> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const original = form.get('original') as unknown;
    const preview = form.get('preview') as unknown;
    if (!isUploadImage(original) || !isUploadImage(preview)) {
      throw new Error('original and preview are required');
    }
    if (!IMAGE_TYPES.has(original.type) || !IMAGE_TYPES.has(preview.type)) throw new Error('only JPEG and PNG are supported');
    if (original.size > MAX_ORIGINAL_BYTES) throw new Error('original image must not exceed 10 MB');
    if (preview.size > MAX_PREVIEW_BYTES) throw new Error('preview image must not exceed 1 MB');

    const token = randomToken();
    const ext = original.type === 'image/png' ? 'png' : 'jpg';
    const previewExt = preview.type === 'image/png' ? 'png' : 'jpg';
    const originalKey = `outbound/${token}/original.${ext}`;
    const previewKey = `outbound/${token}/preview.${previewExt}`;
    await Promise.all([
      env.CHAT_MEDIA.put(originalKey, original.stream(), { httpMetadata: { contentType: original.type } }),
      env.CHAT_MEDIA.put(previewKey, preview.stream(), { httpMetadata: { contentType: preview.type } }),
    ]);
    await env.CHAT_DB.prepare(
      `INSERT INTO outbound_media
       (token, message_id, original_r2_key, preview_r2_key, original_type, preview_type,
        original_size, preview_size, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(token, originalKey, previewKey, original.type, preview.type, original.size, preview.size, Date.now()).run();

    const publicBase = origin.replace(/\/$/, '');
    return {
      type: 'image',
      text: null,
      lineMessage: {
        type: 'image',
        originalContentUrl: `${publicBase}/chat-public/media/${token}/original`,
        previewImageUrl: `${publicBase}/chat-public/media/${token}/preview`,
      },
      media: { token, originalKey, previewKey, original, preview },
    };
  }

  const body = await request.json<{ text?: string }>();
  const text = body.text?.trim();
  if (!text) throw new Error('text is required');
  if (text.length > 5000) throw new Error('text must not exceed 5000 characters');
  return { type: 'text', text, lineMessage: { type: 'text', text } };
}

function isUploadImage(value: unknown): value is UploadImage {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'type' in value &&
      'size' in value &&
      'stream' in value &&
      typeof (value as UploadImage).type === 'string' &&
      typeof (value as UploadImage).size === 'number' &&
      typeof (value as UploadImage).stream === 'function',
  );
}

async function callLine(url: string, payload: unknown, env: Env): Promise<{ ok: boolean; status: number; body: any }> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new UnknownDeliveryError(error instanceof Error ? error.message : String(error));
  }
  const text = await response.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { ok: response.ok, status: response.status, body };
}

async function sendToLine(conversationId: string, lineUserId: string, lineMessage: unknown, env: Env): Promise<LineSendResult> {
  const claimed = await env.CHAT_DB.prepare(
    `UPDATE line_reply_tokens SET consumed_at = ?
     WHERE conversation_id = ? AND consumed_at IS NULL
     RETURNING reply_token`,
  )
    .bind(Date.now(), conversationId)
    .first<{ reply_token: string }>();

  if (claimed) {
    const reply = await callLine(`${LINE_API}/reply`, { replyToken: claimed.reply_token, messages: [lineMessage] }, env);
    if (reply.ok) {
      return { method: 'reply', providerMessageId: String(reply.body.sentMessages?.[0]?.id ?? ''), response: reply.body };
    }
  }

  const push = await callLine(`${LINE_API}/push`, { to: lineUserId, messages: [lineMessage] }, env);
  if (!push.ok) throw new Error(`LINE push failed (${push.status}): ${JSON.stringify(push.body)}`);
  return { method: 'push', providerMessageId: String(push.body.sentMessages?.[0]?.id ?? ''), response: push.body };
}

async function markRequest(env: Env, key: string, state: string, error: string | null, messageId: string | null): Promise<void> {
  await env.CHAT_DB.prepare(
    `UPDATE outbound_requests SET state = ?, error = ?, message_id = ?, updated_at = ? WHERE idempotency_key = ?`,
  )
    .bind(state, error, messageId, Date.now(), key)
    .run();
}

export async function sendConversationMessage(
  request: Request,
  env: Env,
  conversationId: string,
  origin: string,
): Promise<Response> {
  const idempotencyKey = request.headers.get('idempotency-key');
  if (!idempotencyKey || idempotencyKey.length > 120) return errorResponse('valid Idempotency-Key is required', 400);

  const now = Date.now();
  const claim = await env.CHAT_DB.prepare(
    `INSERT OR IGNORE INTO outbound_requests
       (idempotency_key, conversation_id, created_at, state, updated_at)
     VALUES (?, ?, ?, 'sending', ?)`,
  )
    .bind(idempotencyKey, conversationId, now, now)
    .run();
  if (!claim.meta.changes) {
    const existing = await env.CHAT_DB.prepare(`SELECT * FROM outbound_requests WHERE idempotency_key = ?`)
      .bind(idempotencyKey)
      .first<{ state: string; message_id: string | null; error: string | null }>();
    return jsonResponse(
      { delivery_state: existing?.state ?? 'unknown', message_id: existing?.message_id, error: existing?.error },
      existing?.state === 'accepted' ? 200 : 409,
    );
  }

  const conversation = await env.CHAT_DB.prepare(
    `SELECT line_user_id FROM conversations WHERE conversation_id = ?`,
  )
    .bind(conversationId)
    .first<{ line_user_id: string | null }>();
  if (!conversation?.line_user_id) {
    await markRequest(env, idempotencyKey, 'failed', 'LINE user is unavailable', null);
    return errorResponse('LINE user is unavailable', 400);
  }

  let prepared: PreparedOutbound;
  try {
    prepared = await prepareOutbound(request, env, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markRequest(env, idempotencyKey, 'failed', message, null);
    return errorResponse(message, 400);
  }

  try {
    const sent = await sendToLine(conversationId, conversation.line_user_id, prepared.lineMessage, env);
    const messageId = sent.providerMessageId || crypto.randomUUID();
    const payload = JSON.stringify({ ...prepared.lineMessage, lineResponse: sent.response });
    const statements = [
      env.CHAT_DB.prepare(
        `INSERT INTO messages
           (message_id, webhook_event_id, conversation_id, direction, actor, sender_user_id,
            message_type, text, quoted_message_id, payload, occurred_at, created_at,
            provider_message_id, client_idempotency_key, send_method, media_status)
         VALUES (?, NULL, ?, 'outbound', 'staff', NULL, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        messageId,
        conversationId,
        prepared.type,
        prepared.text,
        payload,
        now,
        now,
        sent.providerMessageId || null,
        idempotencyKey,
        sent.method,
        prepared.media ? 'stored' : null,
      ),
      env.CHAT_DB.prepare(
        `UPDATE conversations SET last_event_at = MAX(COALESCE(last_event_at, 0), ?), message_count = message_count + 1
         WHERE conversation_id = ?`,
      ).bind(now, conversationId),
      env.CHAT_DB.prepare(
        `UPDATE outbound_requests SET state = 'accepted', message_id = ?, updated_at = ? WHERE idempotency_key = ?`,
      ).bind(messageId, Date.now(), idempotencyKey),
    ];
    if (prepared.media) {
      statements.push(
        env.CHAT_DB.prepare(
          `UPDATE outbound_media SET message_id = ? WHERE token = ?`,
        ).bind(messageId, prepared.media.token),
      );
      statements.push(
        env.CHAT_DB.prepare(
          `INSERT INTO attachments
             (message_id, kind, content_provider, r2_key, preview_r2_key, content_type, byte_size, status, fetched_at)
           VALUES (?, 'image', 'external', ?, ?, ?, ?, 'stored', ?)`,
        ).bind(
          messageId,
          prepared.media.originalKey,
          prepared.media.previewKey,
          prepared.media.original.type,
          prepared.media.original.size,
          now,
        ),
      );
    }
    await env.CHAT_DB.batch(statements);
    return jsonResponse({ delivery_state: 'accepted', message_id: messageId, send_method: sent.method }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const state = error instanceof UnknownDeliveryError ? 'unknown' : 'failed';
    await markRequest(env, idempotencyKey, state, message, null);
    return jsonResponse({ error: message, delivery_state: state }, state === 'unknown' ? 502 : 422);
  }
}

export async function servePublicOutboundMedia(env: Env, token: string, variant: string): Promise<Response> {
  if (!/^[a-f0-9]{48}$/.test(token) || !['original', 'preview'].includes(variant)) {
    return errorResponse('media not found', 404);
  }
  const media = await env.CHAT_DB.prepare(`SELECT * FROM outbound_media WHERE token = ?`)
    .bind(token)
    .first<{
      original_r2_key: string;
      preview_r2_key: string;
      original_type: string;
      preview_type: string;
    }>();
  if (!media) return errorResponse('media not found', 404);
  const key = variant === 'preview' ? media.preview_r2_key : media.original_r2_key;
  const object = await env.CHAT_MEDIA.get(key);
  if (!object) return errorResponse('media not found', 404);
  return new Response(object.body, {
    headers: {
      'content-type': variant === 'preview' ? media.preview_type : media.original_type,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}
