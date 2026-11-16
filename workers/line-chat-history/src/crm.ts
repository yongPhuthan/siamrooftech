import { adsTouchSchema, probabilityStage, stageProbability, chooseMatch, reviewProblem, reviewSchema, reviewValue, valuationSchema,
  type AdsTouch, type ValuationVersion, type LeadReview, type AttributionMatch } from '../../../src/features/lead-crm/contracts';
import { buildDataManagerPayload } from './ads-sync';
import type { Env, LeadRow } from './types';

export class CrmError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type CrmLead = LeadRow & { model_version: number; revision: number; first_message_at: number | null;
  touch_id: string | null; message_floor_at: number; review_state: string; review_json: string | null };
export async function getCrmLead(env: Env, id: string): Promise<CrmLead> {
  const lead = await env.CHAT_DB.prepare('SELECT * FROM leads WHERE lead_id = ? AND model_version = 2').bind(id).first<CrmLead>();
  if (!lead) throw new CrmError('ไม่พบ opportunity', 404);
  return lead;
}
export async function recordTouch(env: Env, input: unknown, clickedAt = Date.now()): Promise<AdsTouch> {
  const parsed = adsTouchSchema.safeParse(input);
  if (!parsed.success) throw new CrmError('invalid attribution or landing registry');
  const touch = parsed.data;
  const old = await env.CHAT_DB.prepare('SELECT * FROM ads_touches WHERE click_id = ?').bind(touch.click_id)
    .first<{ session_id: string; landing_id: string; attribution_json: string }>();
  if (old && (old.session_id !== touch.session_id || old.landing_id !== touch.landing_id || old.attribution_json !== JSON.stringify(touch.attribution))) {
    throw new CrmError('click ID already used for different data', 409);
  }
  const recorded = await env.CHAT_DB.prepare(`INSERT OR IGNORE INTO ads_touches
    (click_id, session_id, landing_id, landing_path, clicked_at, received_at, attribution_json)
    SELECT ?, ?, ?, ?, ?, ?, ? WHERE
      (SELECT COUNT(*) FROM ads_touches WHERE session_id = ? AND received_at >= ?) < 30 AND
      (SELECT COUNT(*) FROM ads_touches WHERE clicked_at >= ?) < 2000`)
    .bind(touch.click_id, touch.session_id, touch.landing_id, touch.landing_path, clickedAt, Date.now(), JSON.stringify(touch.attribution),
      touch.session_id, Date.now() - 3600_000, Date.now() - 3600_000).run();
  if (!recorded.meta.changes && !old) {
    const duplicate = await env.CHAT_DB.prepare('SELECT click_id FROM ads_touches WHERE click_id = ?').bind(touch.click_id).first();
    if (!duplicate) throw new CrmError('intake rate limit exceeded', 429);
  }
  // Also handles an intake request arriving after the first LINE webhook.
  await reconcileUnmatched(env);
  return touch;
}
export async function ensureOpportunity(env: Env, conversationId: string): Promise<void> {
  if (!conversationId.startsWith('user:')) return;
  const first = await env.CHAT_DB.prepare(`SELECT MIN(occurred_at) AS at FROM messages
    WHERE conversation_id = ? AND direction = 'inbound'`).bind(conversationId).first<{ at: number | null }>();
  if (first?.at == null) return;
  const id = crypto.randomUUID();
  await env.CHAT_DB.prepare(`INSERT OR IGNORE INTO leads
    (lead_id, ref_code, created_at, conversation_id, first_message_at, model_version, status, status_updated_at, currency, ads_state)
    SELECT ?, ?, ?, ?, ?, 2, 'pending', ?, 'THB', 'not_sent'
    WHERE NOT EXISTS (SELECT 1 FROM leads WHERE conversation_id = ?)`)
    .bind(id, `CRM-${id}`, Date.now(), conversationId, first.at, Date.now(), conversationId).run();
  const lead = await env.CHAT_DB.prepare(`SELECT * FROM leads WHERE conversation_id = ? AND model_version = 2
    ORDER BY created_at DESC, lead_id DESC LIMIT 1`).bind(conversationId).first<CrmLead>();
  if (!lead) return; // Preserve legacy conversations; new work is an explicit admin action.
  const next = await env.CHAT_DB.prepare(`SELECT MIN(occurred_at) AS at FROM messages WHERE conversation_id = ?
    AND direction = 'inbound' AND occurred_at >= ?`).bind(conversationId, lead.message_floor_at).first<{ at: number | null }>();
  if (next?.at != null && next.at !== lead.first_message_at && lead.review_state === 'pending') {
    await env.CHAT_DB.prepare(`UPDATE leads SET first_message_at = ?, revision = revision + 1
      WHERE lead_id = ? AND revision = ? AND review_state = 'pending'`)
      .bind(next.at, lead.lead_id, lead.revision).run();
  }
  await reconcileLead(env, await getCrmLead(env, lead.lead_id));
}
export async function candidatesFor(env: Env, lead: CrmLead) {
  if (lead.first_message_at === null) return { candidates: [], selected: null, truncated: false };
  const follows = await env.CHAT_DB.prepare(`SELECT occurred_at FROM events WHERE conversation_id = ?
    AND event_type = 'follow' AND occurred_at <= ? ORDER BY occurred_at`)
    .bind(lead.conversation_id, lead.first_message_at).all<{ occurred_at: number }>();
  const rows = await env.CHAT_DB.prepare(`SELECT t.* FROM ads_touches t
    WHERE NOT EXISTS (SELECT 1 FROM leads l WHERE l.touch_id = t.click_id AND l.lead_id != ?)
    AND (t.clicked_at BETWEEN ? AND ? OR EXISTS (
      SELECT 1 FROM events e WHERE e.conversation_id = ? AND e.event_type = 'follow'
      AND e.occurred_at <= ? AND e.occurred_at BETWEEN t.clicked_at AND t.clicked_at + 1800000))
    ORDER BY t.clicked_at DESC, t.click_id LIMIT 201`)
    .bind(lead.lead_id, lead.first_message_at - 1800000, lead.first_message_at, lead.conversation_id, lead.first_message_at)
    .all<{ click_id: string; clicked_at: number; attribution_json: string; landing_id: string }>();
  const truncated = rows.results.length > 200;
  const match = chooseMatch(rows.results.slice(0, 200), lead.first_message_at, follows.results.map((row) => row.occurred_at));
  return { candidates: match.candidates.map((candidate) => ({ ...candidate,
    touch: rows.results.find((row) => row.click_id === candidate.click_id) })),
    selected: truncated ? null : match.selected, truncated };
}
async function attachTouch(env: Env, lead: CrmLead, match: AttributionMatch, actor: string, evidence: unknown) {
  if (lead.review_state === 'approved' || await env.CHAT_DB.prepare('SELECT 1 FROM crm_conversion_records WHERE lead_id = ?').bind(lead.lead_id).first()) throw new CrmError('คู่ถูกล็อกหลังอนุมัติแล้ว', 409);
  const touch = await env.CHAT_DB.prepare('SELECT attribution_json, landing_path FROM ads_touches WHERE click_id = ?')
    .bind(match.click_id).first<{ attribution_json: string; landing_path: string }>();
  if (!touch) throw new CrmError('ไม่พบ click', 404);
  const data = JSON.parse(touch.attribution_json) as Record<string, string>;
  const fields = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'srt_campaignid', 'srt_adgroupid', 'srt_keyword', 'srt_matchtype', 'srt_device'];
  const token = crypto.randomUUID();
  try {
    const result = await env.CHAT_DB.batch([
      env.CHAT_DB.prepare(`UPDATE leads SET touch_id = ?, matched_at = ?, match_method = ?, landing_page = ?,
        attribution_raw = ?, ${fields.map((field) => `${field} = ?`).join(', ')}, revision = revision + 1, mutation_token = ?
        WHERE lead_id = ? AND revision = ? AND review_state != 'approved'`)
        .bind(match.click_id, Date.now(), match.method, touch.landing_path, touch.attribution_json,
          ...fields.map((field) => data[field] ?? null), token, lead.lead_id, lead.revision),
      env.CHAT_DB.prepare(`INSERT INTO crm_matches (id, lead_id, at, actor, selected_click_id, evidence_json)
        SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM leads WHERE lead_id = ? AND mutation_token = ?)`)
        .bind(token, lead.lead_id, Date.now(), actor, match.click_id, JSON.stringify(evidence), lead.lead_id, token),
    ]);
    if (!result[0].meta.changes) throw new CrmError('ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่', 409);
  } catch (error) {
    if (error instanceof CrmError) throw error;
    if (String(error).includes('UNIQUE')) throw new CrmError('click ถูกผูกกับงานอื่นแล้ว', 409);
    throw error;
  }
}
export async function reconcileLead(env: Env, lead: CrmLead): Promise<void> {
  if (lead.review_state !== 'pending' || lead.first_message_at === null) return;
  const evidence = await candidatesFor(env, lead);
  if (evidence.selected && evidence.selected.click_id !== lead.touch_id) {
    try { await attachTouch(env, lead, evidence.selected, 'system:timestamp', evidence); }
    catch (error) { if (!(error instanceof CrmError && error.status === 409)) throw error; }
  }
}
export async function reconcileUnmatched(env: Env): Promise<void> {
  const rows = await env.CHAT_DB.prepare(`SELECT * FROM leads WHERE model_version = 2
    AND review_state = 'pending' AND first_message_at >= ? ORDER BY created_at DESC LIMIT 100`)
    .bind(Date.now() - 365 * 86400_000).all<CrmLead>();
  for (const lead of rows.results) await reconcileLead(env, lead);
}
export async function selectMatch(env: Env, id: string, revision: number, clickId: string, actor: string) {
  const lead = await getCrmLead(env, id);
  if (lead.revision !== revision) throw new CrmError('ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่', 409);
  const evidence = await candidatesFor(env, lead);
  const candidate = evidence.candidates.find((item) => item.click_id === clickId);
  if (!candidate) throw new CrmError('click ไม่ผ่านช่วงเวลาหรือถูกใช้งานแล้ว', 409);
  await attachTouch(env, lead, { ...candidate, method: 'manual' }, actor, evidence);
}
export async function saveReview(env: Env, id: string, input: unknown, actor: string) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) throw new CrmError('invalid review');
  let review: LeadReview = parsed.data;
  const settingStage = probabilityStage(review.stage);
  const active = settingStage ? await env.CHAT_DB.prepare('SELECT * FROM crm_valuation_versions WHERE stage = ? AND enabled = 1')
    .bind(settingStage).first<ValuationVersion>() : null;
  const setting = stageProbability(review.stage, active ? [{ ...active, enabled: true }] : []);
  if (review.valuation_version_id !== setting.version_id) throw new CrmError('ค่าโอกาสปิดการขายเปลี่ยนแล้ว กรุณาโหลดใหม่', 409);
  // Browser values never override the shared status probability or set manual EV.
  review = { ...review, probability: setting.probability, valuation_version_id: setting.version_id, value: null };
  const problem = reviewProblem(review);
  if (problem) throw new CrmError(problem);
  const lead = await getCrmLead(env, id);
  if (lead.revision !== review.revision) throw new CrmError('ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่', 409);
  const value = reviewValue(review);
  if (review.approve && lead.match_method === 'timestamp') {
    const current = await candidatesFor(env, lead);
    if (current.selected?.click_id !== lead.touch_id) throw new CrmError('หลักฐานเวลาเปลี่ยนแล้ว กรุณาตรวจและเลือกคู่ด้วยมือ', 409);
  }
  const conversion = await env.CHAT_DB.prepare('SELECT * FROM crm_conversion_records WHERE lead_id = ?')
    .bind(id).first<{ state: string }>();
  if (review.approve && conversion?.state !== undefined && conversion.state !== 'active') throw new CrmError('รายการถูกถอนหรือกำลังถอนแล้ว', 409);
  if (review.approve && (!lead.touch_id || !lead.first_message_at || !(lead.gclid || lead.gbraid || lead.wbraid))) {
    throw new CrmError('ต้องมีข้อความแรกและ Ads click ที่จับคู่แล้วก่อนส่ง');
  }
  const now = Date.now();
  const token = crypto.randomUUID();
  const mode = env.CRM_ADS_LIVE_ENABLED === 'true' && env.ADS_SYNC_MODE === 'live' ? 'live' : 'dry_run';
  const latest = await env.CHAT_DB.prepare(`SELECT state FROM ads_sync_jobs WHERE lead_id = ? AND review_id IS NOT NULL ORDER BY sequence DESC LIMIT 1`)
    .bind(id).first<{ state: string }>();
  const oldInitial = await env.CHAT_DB.prepare(`SELECT * FROM ads_sync_jobs WHERE lead_id = ? AND review_id IS NOT NULL AND
    ((? = 'live' AND mode = 'live' AND is_simulation = 0) OR (? = 'dry_run' AND (mode = 'dry_run' OR is_simulation = 1)))
    ORDER BY sequence DESC LIMIT 1`).bind(id, mode, mode)
    .first<{ job_id: string; state: string; conversion_value: number; payload_snapshot: string }>();
  if (review.approve && value === 0 && !oldInitial) throw new CrmError('รายการมูลค่า 0 ก่อนส่งครั้งแรกให้พักไว้ ไม่สร้าง conversion');
  if (review.approve && latest && latest.state !== 'succeeded') throw new CrmError('รอรายการก่อนหน้าสำเร็จหรือแก้ปัญหาการส่งก่อนอนุมัติรุ่นใหม่', 409);
  let payload = review.approve ? buildDataManagerPayload(lead, value!, lead.currency, env) : null;
  if (review.approve && oldInitial) {
    // Destination, identifiers and conversion time belong to the original event.
    payload = JSON.parse(oldInitial.payload_snapshot) as ReturnType<typeof buildDataManagerPayload>;
    if (!payload?.events?.[0]) throw new CrmError('conversion snapshot unavailable', 409);
    payload.events[0].conversionValue = value!;
  }
  const json = JSON.stringify(review);
  const statements = [
    env.CHAT_DB.prepare(`UPDATE leads SET status = ?, status_updated_at = ?, revision = revision + 1,
      mutation_token = ?, review_json = ?, review_state = ?, estimated_value = ?, actual_value = ?
      WHERE lead_id = ? AND revision = ? AND model_version = 2
        AND COALESCE((SELECT id FROM crm_valuation_versions WHERE stage = ? AND enabled = 1), '') = ?`)
      .bind(review.stage, now, token, json, review.approve ? 'approved' : 'reviewed', value, review.actual_profit, id, review.revision, settingStage, setting.version_id ?? ''),
    env.CHAT_DB.prepare(`INSERT INTO crm_reviews (id, lead_id, revision, at, actor, review_json, value)
      SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM leads WHERE lead_id = ? AND mutation_token = ?)`)
      .bind(token, id, review.revision + 1, now, actor, json, value, id, token),
    env.CHAT_DB.prepare(`INSERT INTO lead_events (lead_id, at, actor, kind, from_value, to_value, reason)
      SELECT ?, ?, ?, 'value_change', ?, ?, ? WHERE EXISTS (SELECT 1 FROM leads WHERE lead_id = ? AND mutation_token = ?)`)
      .bind(id, now, actor, String(lead.estimated_value ?? ''), value === null ? null : String(value), review.reason, id, token),
  ];
  if (review.approve) {
    statements.push(
      env.CHAT_DB.prepare(`INSERT OR IGNORE INTO crm_conversion_records (lead_id, transaction_id, event_at)
        SELECT lead_id, lead_id, first_message_at FROM leads WHERE lead_id = ? AND mutation_token = ?`).bind(id, token),
      env.CHAT_DB.prepare(`INSERT INTO ads_sync_jobs
        (job_id, lead_id, created_at, kind, conversion_value, currency, mode, state, attempts, review_id, payload_snapshot, sequence, is_simulation)
        SELECT ?, lead_id, ?, ?, ?, currency, ?, 'pending', 0, ?, ?, revision, ?
        FROM leads WHERE lead_id = ? AND mutation_token = ?`)
        .bind(crypto.randomUUID(), now, oldInitial ? 'restatement' : 'initial', value,
          mode, token, JSON.stringify(payload), Number(mode === 'dry_run'), id, token),
      env.CHAT_DB.prepare(`UPDATE leads SET ads_state = 'pending' WHERE lead_id = ? AND mutation_token = ?`).bind(id, token),
      env.CHAT_DB.prepare(`UPDATE crm_conversion_records SET state = ? WHERE lead_id = ?
        AND EXISTS (SELECT 1 FROM leads WHERE lead_id = ? AND mutation_token = ?)`)
        .bind(value === 0 ? 'retraction_pending' : 'active', id, id, token),
    );
  }
  try {
    const results = await env.CHAT_DB.batch(statements);
    if (!results[0].meta.changes) throw new CrmError('ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่', 409);
  } catch (error) {
    if (error instanceof CrmError) throw error;
    if (String(error).includes('UNIQUE')) throw new CrmError('มีงานเปิดอยู่หรือมีการแก้ไขพร้อมกัน กรุณาโหลดใหม่', 409);
    throw error;
  }
  // The durable outbox is committed above. A queue failure cannot lose approval.
  return getCrmLead(env, id);
}
export async function createValuation(env: Env, input: unknown, actor: string) {
  const parsed = valuationSchema.safeParse(input);
  if (!parsed.success) throw new CrmError('invalid valuation');
  const version = { ...parsed.data, id: crypto.randomUUID(), created_at: Date.now(), actor };
  const statements = [];
  if (version.enabled && version.supersedes_id) statements.push(env.CHAT_DB.prepare(
    'UPDATE crm_valuation_versions SET enabled = 0, superseded_by = ? WHERE id = ? AND stage = ? AND enabled = 1')
    .bind(version.id, version.supersedes_id, version.stage));
  statements.push(env.CHAT_DB.prepare(`INSERT INTO crm_valuation_versions
    (id, stage, label, probability, expected_profit, enabled, created_at, actor)
    SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE ? = 0 OR
      (? IS NULL AND NOT EXISTS (SELECT 1 FROM crm_valuation_versions WHERE stage = ? AND enabled = 1)) OR
      EXISTS (SELECT 1 FROM crm_valuation_versions WHERE id = ? AND superseded_by = ?)`)
    .bind(version.id, version.stage, version.label, version.probability, version.expected_profit, Number(version.enabled), version.created_at, actor,
      Number(version.enabled), version.supersedes_id, version.stage, version.supersedes_id, version.id));
  const results = await env.CHAT_DB.batch(statements);
  if (!results[results.length - 1].meta.changes) throw new CrmError('สูตรเปลี่ยนแล้ว กรุณาโหลดใหม่', 409);
  return version;
}
export async function createNextOpportunity(env: Env, conversationId: string, previousId: string, revision: number, actor: string, reason: string) {
  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = Date.now();
  const results = await env.CHAT_DB.batch([
    env.CHAT_DB.prepare(`INSERT INTO leads
      (lead_id, ref_code, created_at, conversation_id, message_floor_at, model_version, revision, mutation_token, status, currency, ads_state)
      SELECT ?, ?, ?, ?, ?, 2, 0, ?, 'pending', 'THB', 'not_sent'
      WHERE EXISTS (SELECT 1 FROM leads WHERE lead_id = ? AND conversation_id = ? AND revision = ? AND (model_version = 1 OR status IN ('won','lost','disqualified')))
      AND NOT EXISTS (SELECT 1 FROM leads WHERE conversation_id = ? AND model_version = 2 AND status NOT IN ('won','lost','disqualified'))`)
      .bind(id, `CRM-${id}`, now, conversationId, now, token, previousId, conversationId, revision, conversationId),
    env.CHAT_DB.prepare(`INSERT INTO lead_events (lead_id, at, actor, kind, reason)
      SELECT ?, ?, ?, 'status_change', ? WHERE EXISTS (SELECT 1 FROM leads WHERE lead_id = ? AND mutation_token = ?)`)
      .bind(id, now, actor, reason, id, token),
  ]);
  if (!results[0].meta.changes) throw new CrmError('ต้องปิดงานเดิมก่อน และข้อมูลต้องเป็นรุ่นล่าสุด', 409);
  return getCrmLead(env, id);
}
