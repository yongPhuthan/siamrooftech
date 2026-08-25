import { resolveTimeRange, utcMsToIso, utcMsToLocalIso } from './timezone';
import type { AttachmentRow, ConversationRow, Env, MessageRow } from './types';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) {
    // Still run a comparison of equal length to avoid a length-based timing signal.
    await crypto.subtle.digest('SHA-256', aBytes);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

async function requireBearer(request: Request, expectedToken: string): Promise<Response | null> {
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token || !(await timingSafeEqual(token, expectedToken))) {
    return errorResponse('Unauthorized', 401);
  }
  return null;
}

interface Cursor {
  occurredAt: number;
  messageId: string;
}

function encodeCursor(cursor: Cursor): string {
  return btoa(JSON.stringify(cursor));
}

function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(atob(raw));
    if (typeof parsed.occurredAt === 'number' && typeof parsed.messageId === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function serializeMessage(row: MessageRow, attachment: AttachmentRow | null, timezone: string) {
  return {
    message_id: row.message_id,
    conversation_id: row.conversation_id,
    direction: row.direction,
    actor: row.actor,
    type: row.message_type,
    text: row.text,
    quoted_message_id: row.quoted_message_id,
    occurred_at: utcMsToIso(row.occurred_at),
    occurred_at_local: utcMsToLocalIso(row.occurred_at, timezone),
    is_unsent: row.is_unsent === 1,
    unsent_at: row.unsent_at ? utcMsToIso(row.unsent_at) : null,
    edited_at: row.edited_at ? utcMsToIso(row.edited_at) : null,
    attachment: attachment
      ? {
          kind: attachment.kind,
          status: attachment.status,
          content_type: attachment.content_type,
          byte_size: attachment.byte_size,
          file_name: attachment.file_name,
          url: attachment.status === 'stored' ? `/chat-history/media/${row.message_id}` : null,
          preview_url:
            attachment.status === 'stored' && attachment.preview_r2_key
              ? `/chat-history/media/${row.message_id}?variant=preview`
              : null,
          external_url: attachment.content_provider === 'external' ? attachment.external_url : null,
        }
      : null,
  };
}

const COVERAGE = {
  inbound_user_messages: 'complete',
  outbound_bot_messages: 'complete',
  outbound_staff_messages: 'not_captured',
  note: 'LINE does not emit webhook events for replies sent from LINE Official Account Manager.',
};

async function handleListMessages(request: Request, env: Env, url: URL): Promise<Response> {
  let range;
  try {
    range = resolveTimeRange({
      date: url.searchParams.get('date'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      timezone: url.searchParams.get('timezone'),
    });
  } catch (err) {
    return errorResponse((err as Error).message, 400);
  }

  const conversationId = url.searchParams.get('conversation_id');
  const direction = url.searchParams.get('direction');
  if (direction && direction !== 'inbound' && direction !== 'outbound') {
    return errorResponse('direction must be inbound or outbound', 400);
  }

  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT), MAX_LIMIT);

  const cursorParam = url.searchParams.get('cursor');
  const cursor = cursorParam ? decodeCursor(cursorParam) : null;
  if (cursorParam && !cursor) {
    return errorResponse('invalid cursor', 400);
  }

  const conditions = ['occurred_at >= ?', 'occurred_at < ?'];
  const binds: (string | number)[] = [range.fromMs, range.toMs];

  if (conversationId) {
    conditions.push('conversation_id = ?');
    binds.push(conversationId);
  }
  if (direction) {
    conditions.push('direction = ?');
    binds.push(direction);
  }
  if (cursor) {
    conditions.push('(occurred_at > ? OR (occurred_at = ? AND message_id > ?))');
    binds.push(cursor.occurredAt, cursor.occurredAt, cursor.messageId);
  }

  const sql = `SELECT * FROM messages WHERE ${conditions.join(' AND ')} ORDER BY occurred_at ASC, message_id ASC LIMIT ?`;
  const rows = await env.CHAT_DB.prepare(sql)
    .bind(...binds, limit + 1)
    .all<MessageRow>();

  const results = rows.results ?? [];
  const hasMore = results.length > limit;
  const page = hasMore ? results.slice(0, limit) : results;

  const messageIds = page.filter((r) => r.media_status !== null).map((r) => r.message_id);
  const attachmentsByMessageId = new Map<string, AttachmentRow>();
  if (messageIds.length > 0) {
    const placeholders = messageIds.map(() => '?').join(',');
    const attachmentRows = await env.CHAT_DB.prepare(
      `SELECT * FROM attachments WHERE message_id IN (${placeholders})`,
    )
      .bind(...messageIds)
      .all<AttachmentRow>();
    for (const row of attachmentRows.results ?? []) {
      attachmentsByMessageId.set(row.message_id, row);
    }
  }

  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor({
          occurredAt: page[page.length - 1].occurred_at,
          messageId: page[page.length - 1].message_id,
        })
      : null;

  const includeRaw = url.searchParams.get('include') === 'raw';

  return jsonResponse({
    query: {
      from: utcMsToIso(range.fromMs),
      to: utcMsToIso(range.toMs),
      timezone: range.timezone,
      limit,
    },
    coverage: COVERAGE,
    pagination: { has_more: hasMore, next_cursor: nextCursor },
    messages: page.map((row) => {
      const serialized = serializeMessage(row, attachmentsByMessageId.get(row.message_id) ?? null, range.timezone);
      if (includeRaw) {
        return { ...serialized, raw: JSON.parse(row.payload) };
      }
      return serialized;
    }),
  });
}

async function handleListConversations(request: Request, env: Env, url: URL): Promise<Response> {
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT), MAX_LIMIT);

  const cursorParam = url.searchParams.get('cursor');
  let beforeMs = Number.POSITIVE_INFINITY;
  if (cursorParam) {
    const parsed = Number(atob(cursorParam));
    if (!Number.isFinite(parsed)) return errorResponse('invalid cursor', 400);
    beforeMs = parsed;
  }

  const rows = await env.CHAT_DB.prepare(
    `SELECT * FROM conversations WHERE last_event_at < ? ORDER BY last_event_at DESC LIMIT ?`,
  )
    .bind(beforeMs, limit + 1)
    .all<ConversationRow>();

  const results = rows.results ?? [];
  const hasMore = results.length > limit;
  const page = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore && page.length > 0 ? btoa(String(page[page.length - 1].last_event_at)) : null;

  return jsonResponse({
    pagination: { has_more: hasMore, next_cursor: nextCursor },
    conversations: page.map((row) => ({
      conversation_id: row.conversation_id,
      source_type: row.source_type,
      display_name: row.display_name,
      picture_url: row.picture_url,
      is_following: row.is_following === null ? null : row.is_following === 1,
      message_count: row.message_count,
      first_event_at: row.first_event_at ? utcMsToIso(row.first_event_at) : null,
      last_event_at: row.last_event_at ? utcMsToIso(row.last_event_at) : null,
    })),
  });
}

async function handleMedia(env: Env, messageId: string, url: URL): Promise<Response> {
  const variant = url.searchParams.get('variant');
  const attachment = await env.CHAT_DB.prepare(`SELECT * FROM attachments WHERE message_id = ?`)
    .bind(messageId)
    .first<AttachmentRow>();

  if (!attachment || attachment.status !== 'stored') {
    return errorResponse('media not available', 404);
  }

  const key = variant === 'preview' ? attachment.preview_r2_key : attachment.r2_key;
  if (!key) {
    return errorResponse('media not available', 404);
  }

  const object = await env.CHAT_MEDIA.get(key);
  if (!object) {
    return errorResponse('media not available', 404);
  }

  return new Response(object.body, {
    headers: {
      'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'cache-control': 'private, max-age=86400',
    },
  });
}

async function handleHealth(env: Env): Promise<Response> {
  const [pendingFailed, signatureFailures, latestEvent] = await Promise.all([
    env.CHAT_DB.prepare(
      `SELECT status, COUNT(*) as count FROM attachments WHERE status IN ('pending', 'failed') GROUP BY status`,
    ).all<{ status: string; count: number }>(),
    env.CHAT_DB.prepare(`SELECT COUNT(*) as count FROM webhook_deliveries WHERE signature_ok = 0`).first<{
      count: number;
    }>(),
    env.CHAT_DB.prepare(`SELECT MAX(occurred_at) as max_occurred_at FROM events`).first<{
      max_occurred_at: number | null;
    }>(),
  ]);

  const attachmentCounts: Record<string, number> = { pending: 0, failed: 0 };
  for (const row of pendingFailed.results ?? []) {
    attachmentCounts[row.status] = row.count;
  }

  return jsonResponse({
    status: 'ok',
    attachments: attachmentCounts,
    signature_failures: signatureFailures?.count ?? 0,
    latest_event_at: latestEvent?.max_occurred_at ? utcMsToIso(latestEvent.max_occurred_at) : null,
  });
}

export async function handleReadApi(request: Request, env: Env, url: URL): Promise<Response> {
  const authError = await requireBearer(request, env.CHAT_HISTORY_READ_TOKEN);
  if (authError) return authError;

  if (request.method !== 'GET') {
    return errorResponse('method not allowed', 405);
  }

  if (url.pathname === '/chat-history') {
    return handleListMessages(request, env, url);
  }
  if (url.pathname === '/chat-history/conversations') {
    return handleListConversations(request, env, url);
  }
  if (url.pathname === '/chat-history/health') {
    return handleHealth(env);
  }
  const mediaMatch = /^\/chat-history\/media\/(.+)$/.exec(url.pathname);
  if (mediaMatch) {
    return handleMedia(env, mediaMatch[1], url);
  }

  return errorResponse('not found', 404);
}
