import { decodeReceiveCursor, encodeReceiveCursor } from './chat-domain';
import { errorResponse, jsonResponse, requireBearer } from './http';
import { serializeLead } from './leads-api';
import { fetchMessagesPage } from './read-api';
import { sendConversationMessage } from './outbound';
import { utcMsToIso } from './timezone';
import type { AdsSyncJobRow, ConversationRow, Env, LeadEventRow, LeadRow } from './types';

const PAGE_SIZE = 50;

function decodeListCursor(raw: string | null): { lastEventAt: number; conversationId: string } | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(atob(raw));
    return typeof value.lastEventAt === 'number' && typeof value.conversationId === 'string' ? value : null;
  } catch {
    return null;
  }
}

function leadHealth(row: any): { state: string; label: string } {
  const state = row.lead_ads_state ?? 'skipped';
  const labels: Record<string, string> = {
    dry_run: 'จำลองแล้ว (ไม่ได้ส่ง Google)', not_sent: 'ยังไม่พร้อม', pending: 'รอส่ง', ingest_accepted: 'Google รับคำขอ', processing: 'กำลังประมวลผล',
    succeeded: 'สำเร็จ', partial_success: 'สำเร็จบางส่วน', failed: 'ล้มเหลว', skipped: 'Organic / Unknown',
    sent: 'ส่งแล้ว (legacy)', restated: 'ส่งมูลค่าใหม่แล้ว (legacy)',
  };
  return { state, label: labels[state] ?? state };
}

async function listConversations(env: Env, url: URL): Promise<Response> {
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? PAGE_SIZE), 1), 100);
  const query = (url.searchParams.get('q') ?? '').trim();
  const filter = url.searchParams.get('filter') ?? 'all';
  const cursor = decodeListCursor(url.searchParams.get('cursor'));
  if (url.searchParams.has('cursor') && !cursor) return errorResponse('invalid cursor', 400);

  const conditions: string[] = [];
  const binds: Array<string | number> = [];
  if (cursor) {
    conditions.push('(COALESCE(c.last_event_at, 0) < ? OR (COALESCE(c.last_event_at, 0) = ? AND c.conversation_id > ?))');
    binds.push(cursor.lastEventAt, cursor.lastEventAt, cursor.conversationId);
  }
  if (query) {
    conditions.push(`(COALESCE(c.display_name, '') LIKE ? OR COALESCE(l.ref_code, '') LIKE ? OR
      COALESCE(l.utm_campaign, '') LIKE ? OR COALESCE(l.srt_keyword, '') LIKE ? OR
      COALESCE(l.gclid, '') LIKE ? OR COALESCE(l.gbraid, '') LIKE ? OR COALESCE(l.wbraid, '') LIKE ?)`);
    const needle = `%${query}%`;
    binds.push(needle, needle, needle, needle, needle, needle, needle);
  }
  const unreadExpression = `(m.direction = 'inbound' AND (c.read_created_at IS NULL OR m.created_at > c.read_created_at OR (m.created_at = c.read_created_at AND m.message_id > COALESCE(c.read_message_id, ''))))`;
  if (filter === 'unread') conditions.push(`EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.conversation_id AND ${unreadExpression})`);
  if (filter === 'attention') conditions.push(`(l.ads_state IN ('failed', 'partial_success') OR (l.status = 'won' AND l.actual_value IS NULL) OR l.lead_id IS NULL)`);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await env.CHAT_DB.prepare(
    `WITH ranked_leads AS (
       SELECT leads.*, ROW_NUMBER() OVER (
         PARTITION BY conversation_id
         ORDER BY CASE WHEN status IN ('won','lost','disqualified') THEN 1 ELSE 0 END, created_at DESC
       ) AS rn FROM leads WHERE conversation_id IS NOT NULL
     )
     SELECT c.*,
       lm.message_id AS latest_message_id, lm.message_type AS latest_message_type,
       lm.text AS latest_message_text, lm.direction AS latest_message_direction,
       lm.occurred_at AS latest_message_at,
       l.lead_id, l.ref_code, l.status AS lead_status, l.ads_state AS lead_ads_state,
       l.actual_value, l.estimated_value, l.currency,
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.conversation_id AND ${unreadExpression}) AS unread_count
     FROM conversations c
     LEFT JOIN messages lm ON lm.message_id = (
       SELECT message_id FROM messages WHERE conversation_id = c.conversation_id AND is_unsent = 0 AND occurred_at >= ?
       ORDER BY occurred_at DESC, message_id DESC LIMIT 1
     )
     LEFT JOIN ranked_leads l ON l.conversation_id = c.conversation_id AND l.rn = 1
     ${where}
     ORDER BY COALESCE(c.last_event_at, 0) DESC, c.conversation_id ASC LIMIT ?`,
  )
    .bind(Date.now() - 365 * 86400_000, ...binds, limit + 1)
    .all<any>();
  const rows = result.results ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return jsonResponse({
    pagination: {
      has_more: hasMore,
      next_cursor: hasMore && last ? btoa(JSON.stringify({ lastEventAt: last.last_event_at ?? 0, conversationId: last.conversation_id })) : null,
    },
    conversations: page.map((row) => {
      let attentionReason: string | null = null;
      if (!row.lead_id) attentionReason = 'attribution_unmatched';
      else if (row.lead_ads_state === 'failed') attentionReason = 'data_manager_failed';
      else if (row.lead_ads_state === 'partial_success') attentionReason = 'data_manager_partial';
      else if (row.lead_status === 'won' && row.actual_value === null) attentionReason = 'won_without_value';
      return {
        conversation_id: row.conversation_id,
        display_name: row.display_name || 'ลูกค้า LINE',
        picture_url: row.picture_url,
        is_following: row.is_following === null ? null : row.is_following === 1,
        last_event_at: row.last_event_at ? utcMsToIso(row.last_event_at) : null,
        unread_count: Number(row.unread_count ?? 0),
        latest_message: row.latest_message_id ? {
          id: row.latest_message_id, type: row.latest_message_type, text: row.latest_message_text,
          direction: row.latest_message_direction, occurred_at: utcMsToIso(row.latest_message_at),
        } : null,
        active_lead: row.lead_id ? { id: row.lead_id, ref_code: row.ref_code, status: row.lead_status } : null,
        google_health: leadHealth(row),
        attention_reason: attentionReason,
      };
    }),
  });
}

async function conversationDetail(env: Env, conversationId: string): Promise<Response> {
  const conversation = await env.CHAT_DB.prepare(`SELECT * FROM conversations WHERE conversation_id = ?`)
    .bind(conversationId)
    .first<ConversationRow>();
  if (!conversation) return errorResponse('conversation not found', 404);
  const [messages, leadRows] = await Promise.all([
    fetchMessagesPage(env, { fromMs: 0, toMs: Date.now() + 1, conversationId, limit: 300, timezone: 'Asia/Bangkok', latest: true }),
    env.CHAT_DB.prepare(
      `SELECT * FROM leads WHERE conversation_id = ?
       ORDER BY CASE WHEN status IN ('won','lost','disqualified') THEN 1 ELSE 0 END, created_at DESC`,
    ).bind(conversationId).all<LeadRow>(),
  ]);
  const leads = leadRows.results ?? [];
  const activeLead = leads[0] ?? null;
  const leadIds = leads.map((lead) => lead.lead_id);
  let events: LeadEventRow[] = [];
  let jobs: AdsSyncJobRow[] = [];
  let attempts: unknown[] = [];
  if (leadIds.length) {
    const placeholders = leadIds.map(() => '?').join(',');
    const [eventRows, jobRows, attemptRows] = await Promise.all([
      env.CHAT_DB.prepare(`SELECT * FROM lead_events WHERE lead_id IN (${placeholders}) ORDER BY at DESC`).bind(...leadIds).all<LeadEventRow>(),
      env.CHAT_DB.prepare(`SELECT * FROM ads_sync_jobs WHERE lead_id IN (${placeholders}) ORDER BY created_at DESC`).bind(...leadIds).all<AdsSyncJobRow>(),
      env.CHAT_DB.prepare(`SELECT * FROM ads_sync_attempts WHERE lead_id IN (${placeholders}) ORDER BY attempted_at DESC`).bind(...leadIds).all(),
    ]);
    events = eventRows.results ?? [];
    jobs = jobRows.results ?? [];
    attempts = attemptRows.results ?? [];
  }
  const windowMs = 15 * 60 * 1000;
  const candidates = await env.CHAT_DB.prepare(
    `SELECT * FROM leads WHERE conversation_id IS NULL AND created_at BETWEEN ? AND ? ORDER BY ABS(created_at - ?) LIMIT 5`,
  )
    .bind((conversation.first_event_at ?? 0) - windowMs, (conversation.first_event_at ?? 0) + windowMs, conversation.first_event_at ?? 0)
    .all<LeadRow>();
  return jsonResponse({
    conversation: {
      conversation_id: conversation.conversation_id,
      display_name: conversation.display_name || 'ลูกค้า LINE',
      picture_url: conversation.picture_url,
      is_following: conversation.is_following === null ? null : conversation.is_following === 1,
      active_lead_id: activeLead?.lead_id ?? null,
      google_health: leadHealth({ lead_ads_state: activeLead?.ads_state ?? 'skipped' }),
    },
    messages: messages.messages,
    pagination: messages.pagination,
    receive_cursor: messages.receiveCursor ? encodeReceiveCursor(messages.receiveCursor) : null,
    profile: {
      leads: leads.map(serializeLead),
      unmatched_candidates: (candidates.results ?? []).map(serializeLead),
      events: events.map((event) => ({ ...event, at: utcMsToIso(event.at) })),
      ads_jobs: jobs.map((job) => ({
        ...job,
        created_at: utcMsToIso(job.created_at),
        completed_at: job.completed_at ? utcMsToIso(job.completed_at) : null,
        last_checked_at: job.last_checked_at ? utcMsToIso(job.last_checked_at) : null,
        request_payload: job.request_payload ? JSON.parse(job.request_payload) : null,
        diagnostics: job.diagnostics_json ? JSON.parse(job.diagnostics_json) : null,
      })),
      ads_attempts: attempts,
    },
  });
}

async function markRead(request: Request, env: Env, conversationId: string): Promise<Response> {
  const body: { cursor?: string } = await request.json<{ cursor?: string }>().catch(() => ({}));
  const cursor = body.cursor ? decodeReceiveCursor(body.cursor) : null;
  if (!cursor) return errorResponse('valid receive cursor is required', 400);
  await env.CHAT_DB.prepare(
    `UPDATE conversations SET read_created_at = ?, read_message_id = ?
     WHERE conversation_id = ? AND (
       read_created_at IS NULL OR read_created_at < ? OR (read_created_at = ? AND COALESCE(read_message_id, '') < ?)
     )`,
  ).bind(cursor.createdAt, cursor.messageId, conversationId, cursor.createdAt, cursor.createdAt, cursor.messageId).run();
  return jsonResponse({ ok: true });
}

async function retryAds(): Promise<Response> {
  return errorResponse('use reviewed CRM retry with revision', 409);
}

export async function handleChatApi(request: Request, env: Env, url: URL): Promise<Response> {
  const detail = /^\/chat\/conversations\/([^/]+)$/.exec(url.pathname);
  const read = /^\/chat\/conversations\/([^/]+)\/read$/.exec(url.pathname);
  const messages = /^\/chat\/conversations\/([^/]+)\/messages$/.exec(url.pathname);
  const retry = /^\/chat\/conversations\/([^/]+)\/ads-retry$/.exec(url.pathname);
  const isWrite = Boolean(read || messages || retry);
  const authError = await requireBearer(request, isWrite ? env.CHAT_HISTORY_WRITE_TOKEN : env.CHAT_HISTORY_READ_TOKEN);
  if (authError) return authError;

  if (url.pathname === '/chat/conversations' && request.method === 'GET') return listConversations(env, url);
  if (detail && request.method === 'GET') return conversationDetail(env, decodeURIComponent(detail[1]));
  if (read && request.method === 'POST') return markRead(request, env, decodeURIComponent(read[1]));
  if (messages && request.method === 'POST') return sendConversationMessage(request, env, decodeURIComponent(messages[1]), url.origin);
  if (retry && request.method === 'POST') return retryAds();
  return errorResponse('not found', 404);
}
