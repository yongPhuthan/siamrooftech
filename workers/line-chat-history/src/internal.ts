import type { Env } from './types';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) {
    await crypto.subtle.digest('SHA-256', aBytes);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

interface OutboundMessageRequest {
  conversation_id: string;
  message_id?: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
  text?: string;
  occurred_at?: string;
  payload?: Record<string, unknown>;
}

/**
 * Records a message the bot sent (Messaging API push/reply), since LINE does
 * not emit a webhook event for the OA's own outbound messages. There is no
 * producer wired up to this yet — the endpoint and schema exist so a future
 * auto-reply feature can log here without a schema migration.
 */
export async function handleOutboundMessage(request: Request, env: Env): Promise<Response> {
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token || !(await timingSafeEqual(token, env.CHAT_HISTORY_WRITE_TOKEN))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method not allowed' }, 405);
  }

  let body: OutboundMessageRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON' }, 400);
  }

  if (!body.conversation_id || !body.message_type) {
    return jsonResponse({ error: 'conversation_id and message_type are required' }, 400);
  }

  const messageId = body.message_id ?? crypto.randomUUID();
  const occurredAt = body.occurred_at ? Date.parse(body.occurred_at) : Date.now();
  const now = Date.now();

  await env.CHAT_DB.prepare(
    `INSERT INTO messages
       (message_id, webhook_event_id, conversation_id, direction, actor, sender_user_id,
        message_type, text, quoted_message_id, payload, occurred_at, created_at)
     VALUES (?, NULL, ?, 'outbound', 'bot', NULL, ?, ?, NULL, ?, ?, ?)`,
  )
    .bind(
      messageId,
      body.conversation_id,
      body.message_type,
      body.text ?? null,
      JSON.stringify(body.payload ?? {}),
      occurredAt,
      now,
    )
    .run();

  await env.CHAT_DB.prepare(
    `INSERT INTO conversations (conversation_id, source_type, first_event_at, last_event_at, message_count)
     VALUES (?, 'user', ?, ?, 1)
     ON CONFLICT(conversation_id) DO UPDATE SET
       last_event_at = MAX(conversations.last_event_at, excluded.last_event_at),
       message_count = conversations.message_count + 1`,
  )
    .bind(body.conversation_id, occurredAt, occurredAt)
    .run();

  return jsonResponse({ message_id: messageId }, 201);
}
