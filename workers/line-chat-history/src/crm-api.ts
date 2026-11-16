import { readJsonBody } from '../../../src/features/lead-crm/json-body';
import { z } from 'zod';
import { revisionSchema } from '../../../src/features/lead-crm/contracts';
import { candidatesFor, createNextOpportunity, createValuation, CrmError, getCrmLead, recordTouch, saveReview, selectMatch } from './crm';
import { handleHistory } from './crm-history';
import { errorResponse, jsonResponse, requireBearer } from './http';
import type { Env } from './types';

const matchInput = z.object({ revision: revisionSchema, click_id: z.string().uuid() }).strict();
const nextInput = z.object({ previous_id: z.string().uuid(), revision: revisionSchema, reason: z.string().trim().min(1).max(2000) }).strict();
const retryInput = z.object({ revision: revisionSchema, job_id: z.string().uuid() }).strict();

export async function handleCrmApi(request: Request, env: Env, url: URL): Promise<Response> {
  const intake = url.pathname === '/internal/leads/intake';
  const isWrite = request.method === 'POST';
  const authError = await requireBearer(request, intake ? env.LEADS_INTAKE_TOKEN : isWrite ? env.CHAT_HISTORY_WRITE_TOKEN : env.CHAT_HISTORY_READ_TOKEN);
  if (authError) return authError;
  if (!['GET', 'POST'].includes(request.method)) return errorResponse('method not allowed', 405);
  const actor = request.headers.get('x-crm-actor');
  if (isWrite && !intake && (!actor?.startsWith('admin:') || actor.length > 200)) return errorResponse('authenticated admin actor required', 403);
  try {
    if (intake && isWrite) {
      if (Number(request.headers.get('content-length') ?? 0) > 16384) throw new CrmError('payload too large', 413);
      const rawAt = request.headers.get('x-crm-click-at');
      const clickedAt = rawAt === null ? Date.now() : Number(rawAt);
      if (!Number.isSafeInteger(clickedAt) || clickedAt > Date.now() + 1000 || clickedAt < Date.now() - 30_000) throw new CrmError('invalid click receipt timestamp');
      const touch = await recordTouch(env, await readJsonBody(request), clickedAt);
      return jsonResponse({ click_id: touch.click_id }, 201);
    }
    if (url.pathname === '/crm/valuations') {
      if (isWrite) return jsonResponse(await createValuation(env, await readJsonBody(request), actor!), 201);
      const versions = await env.CHAT_DB.prepare(`SELECT v.*, (SELECT old.id FROM crm_valuation_versions old WHERE old.superseded_by = v.id LIMIT 1) AS supersedes_id
        FROM crm_valuation_versions v ORDER BY created_at DESC, id DESC`).all<{ enabled: number }>();
      return jsonResponse(versions.results.map((version) => ({ ...version, enabled: version.enabled === 1 })));
    }
    if (url.pathname === '/crm/health' && !isWrite) {
      const [retention, pending] = await Promise.all([
        env.CHAT_DB.prepare('SELECT * FROM crm_retention_runs ORDER BY started_at DESC, id DESC LIMIT 1').first(),
        env.CHAT_DB.prepare("SELECT COUNT(*) AS count, MIN(created_at) AS oldest_at FROM ads_sync_jobs WHERE review_id IS NOT NULL AND state = 'pending'").first(),
      ]);
      return jsonResponse({ retention, pending,
        delivery_mode: env.CRM_ADS_LIVE_ENABLED === 'true' && env.ADS_SYNC_MODE === 'live' ? 'live' : 'dry_run' });
    }
    if (url.pathname === '/crm/summary' && !isWrite) {
      const rows = await env.CHAT_DB.prepare(`SELECT strftime('%Y-%m', COALESCE(first_message_at, created_at) / 1000, 'unixepoch', '+7 hours') AS cohort,
        COUNT(*) AS total, SUM(status = 'won') AS won, SUM(status = 'lost') AS lost,
        SUM(status = 'disqualified') AS disqualified, SUM(status NOT IN ('won','lost','disqualified')) AS open,
        MIN(COALESCE(first_message_at, created_at)) AS oldest_at, SUM(CASE WHEN status = 'won' THEN actual_value ELSE 0 END) AS actual_profit,
        SUM(CASE WHEN status = 'won' THEN json_extract(review_json, '$.sales_amount') END) AS sales_amount
        FROM leads WHERE model_version = 2 GROUP BY cohort ORDER BY cohort DESC`).all();
      return jsonResponse(rows.results);
    }
    if (['/crm/messages', '/crm/export'].includes(url.pathname) && !isWrite) return handleHistory(env, url);
    if (url.pathname === '/crm/leads' && !isWrite) {
      const conditions = ['l.model_version = 2'];
      const args: Array<string | number> = [];
      const q = (url.searchParams.get('q') ?? '').trim();
      if (q.length > 200) throw new CrmError('คำค้นยาวเกินไป');
      if (q) { conditions.push(`(instr(COALESCE(c.display_name,''), ?) > 0 OR instr(COALESCE(l.srt_keyword,''), ?) > 0 OR EXISTS
        (SELECT 1 FROM messages m WHERE m.conversation_id = l.conversation_id AND m.is_unsent = 0 AND instr(COALESCE(m.text,''), ?) > 0))`); args.push(q, q, q); }
      const queue = url.searchParams.get('queue');
      if (queue && !['all', 'pending', 'overdue', 'unmatched', 'errors'].includes(queue)) throw new CrmError('invalid review queue');
      if (queue === 'pending') conditions.push("l.review_state != 'approved' AND l.status NOT IN ('won','lost','disqualified')");
      if (queue === 'overdue') { conditions.push("l.review_state = 'pending' AND l.first_message_at < ?"); args.push(Date.now() - 7 * 86400_000); }
      if (queue === 'unmatched') conditions.push('l.touch_id IS NULL');
      if (queue === 'errors') conditions.push("l.ads_state IN ('failed','partial_success')");
      const cursor = url.searchParams.get('cursor');
      if (cursor) {
        let page: { at: number; id: string };
        try { page = JSON.parse(atob(cursor)); } catch { throw new CrmError('invalid cursor'); }
        if (!Number.isSafeInteger(page.at) || typeof page.id !== 'string' || page.id.length > 200) throw new CrmError('invalid cursor');
        conditions.push('(COALESCE(c.last_event_at,l.created_at) < ? OR (COALESCE(c.last_event_at,l.created_at) = ? AND l.lead_id > ?))');
        args.push(page.at, page.at, page.id);
      }
      const rows = await env.CHAT_DB.prepare(`SELECT l.*, c.display_name, c.picture_url,
        COALESCE(c.last_event_at,l.created_at) AS last_message_at FROM leads l
        LEFT JOIN conversations c ON c.conversation_id = l.conversation_id
        WHERE ${conditions.join(' AND ')} ORDER BY last_message_at DESC, l.lead_id LIMIT 101`).bind(...args).all<{ last_message_at: number; lead_id: string }>();
      const leads = rows.results.slice(0, 100);
      const last = leads[leads.length - 1];
      return jsonResponse({ leads, next_cursor: rows.results.length > 100 && last ? btoa(JSON.stringify({ at: last.last_message_at, id: last.lead_id })) : null });
    }
    const conversation = /^\/crm\/conversations\/([^/]+)$/.exec(url.pathname);
    if (conversation && !isWrite) return jsonResponse((await env.CHAT_DB.prepare('SELECT * FROM leads WHERE conversation_id = ? ORDER BY created_at DESC, lead_id DESC')
      .bind(decodeURIComponent(conversation[1])).all()).results);
    const newOpportunity = /^\/crm\/conversations\/([^/]+)\/opportunities$/.exec(url.pathname);
    if (newOpportunity && isWrite) {
      const body = nextInput.parse(await readJsonBody(request));
      return jsonResponse(await createNextOpportunity(env, decodeURIComponent(newOpportunity[1]), body.previous_id, body.revision, actor!, body.reason), 201);
    }
    const route = /^\/crm\/leads\/([^/]+)(?:\/(review|match|retry))?$/.exec(url.pathname);
    if (route) {
      const id = route[1];
      if (!route[2] && !isWrite) {
        const lead = await getCrmLead(env, id);
        const [evidence, matches, reviews, jobs, profile, conversion, touch] = await Promise.all([
          candidatesFor(env, lead),
          env.CHAT_DB.prepare('SELECT * FROM crm_matches WHERE lead_id = ? ORDER BY at DESC, id DESC').bind(id).all(),
          env.CHAT_DB.prepare('SELECT * FROM crm_reviews WHERE lead_id = ? ORDER BY revision DESC').bind(id).all(),
          env.CHAT_DB.prepare('SELECT * FROM ads_sync_jobs WHERE lead_id = ? ORDER BY sequence DESC, created_at DESC').bind(id).all(),
          env.CHAT_DB.prepare('SELECT display_name, picture_url FROM conversations WHERE conversation_id = ?').bind(lead.conversation_id).first(),
          env.CHAT_DB.prepare('SELECT * FROM crm_conversion_records WHERE lead_id = ?').bind(id).first(),
          env.CHAT_DB.prepare('SELECT clicked_at, received_at, landing_path, landing_id FROM ads_touches WHERE click_id = ?').bind(lead.touch_id).first(),
        ]);
        return jsonResponse({ lead, profile, conversion, touch, evidence, matches: matches.results, reviews: reviews.results, jobs: jobs.results });
      }
      if (route[2] === 'review' && isWrite) return jsonResponse(await saveReview(env, id, await readJsonBody(request), actor!));
      if (route[2] === 'match' && isWrite) {
        const body = matchInput.parse(await readJsonBody(request));
        await selectMatch(env, id, body.revision, body.click_id, actor!);
        return jsonResponse({ ok: true });
      }
      if (route[2] === 'retry' && isWrite) {
        const body = retryInput.parse(await readJsonBody(request));
        const lead = await getCrmLead(env, id);
        if (lead.revision !== body.revision) throw new CrmError('ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่', 409);
        const job = await env.CHAT_DB.prepare('SELECT * FROM ads_sync_jobs WHERE job_id = ? AND lead_id = ? AND review_id IS NOT NULL')
          .bind(body.job_id, id).first<{ state: string; google_request_id: string | null }>();
        if (!job || job.state !== 'failed') throw new CrmError('รายการนี้ยัง retry ไม่ได้', 409);
        // A request with a Google ID may already have converted: check its status, never blindly re-ingest.
        await env.CHAT_DB.batch([
          env.CHAT_DB.prepare(`UPDATE ads_sync_jobs SET state = ?, error = NULL, completed_at = NULL, lease_until = 0,
            last_dispatch_at = NULL, next_check_at = ?, first_accepted_at = CASE WHEN google_request_id IS NOT NULL THEN ? ELSE first_accepted_at END
            WHERE job_id = ? AND state = 'failed'`)
            .bind(job.google_request_id ? 'processing' : 'pending', Date.now(), Date.now(), body.job_id),
          env.CHAT_DB.prepare(`INSERT INTO ads_sync_attempts (job_id, lead_id, attempted_at, kind, outcome)
            VALUES (?, ?, ?, 'manual_retry', ?)`)
            .bind(body.job_id, id, Date.now(), actor!),
        ]);
        return jsonResponse({ ok: true });
      }
    }
    return errorResponse('not found', 404);
  } catch (error) {
    if (error instanceof CrmError) return errorResponse(error.message, error.status);
    if (error instanceof z.ZodError || error instanceof SyntaxError || error instanceof RangeError) return errorResponse('invalid request', 400);
    console.error('CRM request failed', url.pathname);
    return errorResponse('CRM unavailable', 503);
  }
}
