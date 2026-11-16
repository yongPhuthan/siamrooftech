import { errorResponse, jsonResponse, requireBearer } from './http';
import { fetchMessagesPage, decodeCursor } from './read-api';
import { resolveTimeRange, utcMsToIso } from './timezone';
import type { AdsSyncJobRow, Env, LeadEventRow, LeadRow } from './types';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export function serializeLead(row: LeadRow) {
  return {
    lead_id: row.lead_id,
    model_version: row.model_version ?? 1,
    ref_code: row.ref_code,
    created_at: utcMsToIso(row.created_at),
    attribution: {
      gclid: row.gclid,
      gbraid: row.gbraid,
      wbraid: row.wbraid,
      lead_persona: row.lead_persona,
      lead_quality_score: row.lead_quality_score,
      utm_source: row.utm_source,
      utm_medium: row.utm_medium,
      utm_campaign: row.utm_campaign,
      utm_term: row.utm_term,
      utm_content: row.utm_content,
      srt_campaignid: row.srt_campaignid,
      srt_adgroupid: row.srt_adgroupid,
      srt_keyword: row.srt_keyword,
      srt_matchtype: row.srt_matchtype,
      srt_device: row.srt_device,
      landing_page: row.landing_page,
    },
    match: {
      conversation_id: row.conversation_id,
      matched_at: row.matched_at ? utcMsToIso(row.matched_at) : null,
      match_method: row.match_method,
    },
    status: row.status,
    status_updated_at: row.status_updated_at ? utcMsToIso(row.status_updated_at) : null,
    value: {
      persona_value: row.persona_value,
      estimated_value: row.estimated_value,
      actual_value: row.actual_value,
      currency: row.currency,
    },
    ads_sync: {
      state: row.ads_state,
      last_value: row.ads_last_value,
      last_sent_at: row.ads_last_sent_at ? utcMsToIso(row.ads_last_sent_at) : null,
      last_error: row.ads_last_error,
    },
    notes: row.notes,
  };
}

async function handleListLeads(env: Env, url: URL): Promise<Response> {
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

  const status = url.searchParams.get('status');
  const matchFilter = url.searchParams.get('match'); // 'matched' | 'unmatched'
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT), MAX_LIMIT);

  const cursorParam = url.searchParams.get('cursor');
  let cursor: { createdAt: number; leadId: string } | null = null;
  if (cursorParam) {
    try {
      cursor = JSON.parse(atob(cursorParam));
    } catch {
      return errorResponse('invalid cursor', 400);
    }
  }

  const conditions = ['created_at >= ?', 'created_at < ?'];
  const binds: (string | number)[] = [range.fromMs, range.toMs];

  if (status) {
    conditions.push('status = ?');
    binds.push(status);
  }
  if (matchFilter === 'matched') conditions.push('conversation_id IS NOT NULL');
  if (matchFilter === 'unmatched') conditions.push('conversation_id IS NULL');
  if (cursor) {
    conditions.push('(created_at > ? OR (created_at = ? AND lead_id > ?))');
    binds.push(cursor.createdAt, cursor.createdAt, cursor.leadId);
  }

  const sql = `SELECT * FROM leads WHERE ${conditions.join(' AND ')} ORDER BY created_at ASC, lead_id ASC LIMIT ?`;
  const rows = await env.CHAT_DB.prepare(sql)
    .bind(...binds, limit + 1)
    .all<LeadRow>();

  const results = rows.results ?? [];
  const hasMore = results.length > limit;
  const page = hasMore ? results.slice(0, limit) : results;
  const nextCursor =
    hasMore && page.length > 0
      ? btoa(JSON.stringify({ createdAt: page[page.length - 1].created_at, leadId: page[page.length - 1].lead_id }))
      : null;

  return jsonResponse({
    query: { from: utcMsToIso(range.fromMs), to: utcMsToIso(range.toMs), timezone: range.timezone, limit },
    pagination: { has_more: hasMore, next_cursor: nextCursor },
    leads: page.map(serializeLead),
  });
}

async function handleUnmatchedLeads(env: Env, url: URL): Promise<Response> {
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT), MAX_LIMIT);

  const rows = await env.CHAT_DB.prepare(
    `SELECT * FROM leads WHERE conversation_id IS NULL ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all<LeadRow>();

  const leads = rows.results ?? [];

  // Candidate suggestion only — never auto-bound. A conversation started by
  // a NEW (never-seen-before) LINE user within +/-15 minutes of the lead's
  // click is surfaced for a human to confirm in the dashboard.
  const candidates = await Promise.all(
    leads.map(async (lead) => {
      const windowMs = 15 * 60 * 1000;
      const nearby = await env.CHAT_DB.prepare(
        `SELECT conversation_id, first_event_at FROM conversations
         WHERE first_event_at BETWEEN ? AND ?
         ORDER BY ABS(first_event_at - ?) ASC LIMIT 3`,
      )
        .bind(lead.created_at - windowMs, lead.created_at + windowMs, lead.created_at)
        .all<{ conversation_id: string; first_event_at: number }>();
      return { lead_id: lead.lead_id, candidates: nearby.results ?? [] };
    }),
  );
  const candidatesByLeadId = new Map(candidates.map((c) => [c.lead_id, c.candidates]));

  return jsonResponse({
    leads: leads.map((lead) => ({
      ...serializeLead(lead),
      time_window_candidates: (candidatesByLeadId.get(lead.lead_id) ?? []).map((c) => ({
        conversation_id: c.conversation_id,
        first_event_at: utcMsToIso(c.first_event_at),
      })),
    })),
  });
}

async function handleGetLead(env: Env, leadId: string, url: URL): Promise<Response> {
  const lead = await env.CHAT_DB.prepare(`SELECT * FROM leads WHERE lead_id = ?`).bind(leadId).first<LeadRow>();
  if (!lead) return errorResponse('lead not found', 404);

  const events = await env.CHAT_DB.prepare(`SELECT * FROM lead_events WHERE lead_id = ? ORDER BY at ASC`)
    .bind(leadId)
    .all<LeadEventRow>();

  const withTranscript = url.searchParams.get('with_transcript') === '1';
  let transcript: unknown[] | null = null;
  if (withTranscript && lead.conversation_id) {
    const timezone = url.searchParams.get('timezone') || 'Asia/Bangkok';
    const page = await fetchMessagesPage(env, {
      fromMs: 0,
      toMs: Date.now() + 1,
      conversationId: lead.conversation_id,
      limit: MAX_LIMIT,
      timezone,
    });
    transcript = page.messages;
  }

  return jsonResponse({
    ...serializeLead(lead),
    events: (events.results ?? []).map((e) => ({
      at: utcMsToIso(e.at),
      actor: e.actor,
      kind: e.kind,
      from_value: e.from_value,
      to_value: e.to_value,
      reason: e.reason,
    })),
    transcript,
  });
}

async function handleTranscript(env: Env, leadId: string, url: URL): Promise<Response> {
  const lead = await env.CHAT_DB.prepare(`SELECT conversation_id FROM leads WHERE lead_id = ?`)
    .bind(leadId)
    .first<{ conversation_id: string | null }>();
  if (!lead) return errorResponse('lead not found', 404);
  if (!lead.conversation_id) return jsonResponse({ conversation_id: null, messages: [] });

  const timezone = url.searchParams.get('timezone') || 'Asia/Bangkok';
  const cursorParam = url.searchParams.get('cursor');
  const cursor = cursorParam ? decodeCursor(cursorParam) : null;
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT), MAX_LIMIT);

  const page = await fetchMessagesPage(env, {
    fromMs: 0,
    toMs: Date.now() + 1,
    conversationId: lead.conversation_id,
    cursor,
    limit,
    timezone,
  });

  return jsonResponse({ conversation_id: lead.conversation_id, ...page });
}

async function handleAdsSyncJobs(env: Env, url: URL): Promise<Response> {
  const state = url.searchParams.get('state');
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT), MAX_LIMIT);

  const sql = state
    ? `SELECT * FROM ads_sync_jobs WHERE state = ? ORDER BY created_at DESC LIMIT ?`
    : `SELECT * FROM ads_sync_jobs ORDER BY created_at DESC LIMIT ?`;
  const stmt = state ? env.CHAT_DB.prepare(sql).bind(state, limit) : env.CHAT_DB.prepare(sql).bind(limit);
  const rows = await stmt.all<AdsSyncJobRow>();

  return jsonResponse({
    jobs: (rows.results ?? []).map((job) => ({
      job_id: job.job_id,
      lead_id: job.lead_id,
      created_at: utcMsToIso(job.created_at),
      kind: job.kind,
      conversion_value: job.conversion_value,
      currency: job.currency,
      mode: job.mode,
      state: job.state,
      attempts: job.attempts,
      request_payload: job.request_payload ? JSON.parse(job.request_payload) : null,
      response_body: job.response_body,
      error: job.error,
      completed_at: job.completed_at ? utcMsToIso(job.completed_at) : null,
    })),
  });
}


export async function handleLeadsApi(request: Request, env: Env, url: URL): Promise<Response> {
  const auth = await requireBearer(request, request.method === 'GET' ? env.CHAT_HISTORY_READ_TOKEN : env.CHAT_HISTORY_WRITE_TOKEN);
  if (auth) return auth;
  if (request.method !== 'GET') return errorResponse('Legacy API is read-only; use reviewed CRM', 409);
  if (url.pathname === '/leads') return handleListLeads(env, url);
  if (url.pathname === '/leads/unmatched') return handleUnmatchedLeads(env, url);
  if (url.pathname === '/ads-sync/jobs') return handleAdsSyncJobs(env, url);
  const transcript = /^\/leads\/([^/]+)\/transcript$/.exec(url.pathname);
  if (transcript) return handleTranscript(env, transcript[1], url);
  const detail = /^\/leads\/([^/]+)$/.exec(url.pathname);
  if (detail) return handleGetLead(env, detail[1], url);
  return errorResponse('not found', 404);
}
