import type { AdsSyncQueueMessage, Env, LeadPersona, LeadRow, LeadStatus } from './types';

// Crockford-style alphabet (no 0/O, 1/I/L, U) so ref codes stay unambiguous
// even though they're never hand-typed — just prefilled into LINE.
const REF_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const REF_CODE_LENGTH = 8;
const REF_CODE_PATTERN = /SRT-([23456789ABCDEFGHJKMNPQRSTVWXYZ]{8})/;

// Never 0: a Data Manager restatement to 0.00 permanently retracts the
// conversion and cannot be adjusted again afterward (see
// docs/lead-matching/README.md). contractor leads still get a token 1 THB
// so the initial conversion exists and can be restated later.
export const PERSONA_VALUES: Record<LeadPersona, number> = {
  homeowner: 100,
  procurement: 100,
  contractor: 1,
};

// A matched first LINE message is the real initial conversion. The value is
// deliberately a 1 THB technical placeholder (not revenue); staff can later
// restate the same transactionId with an estimated or actual business value.
export const LINE_MESSAGE_CONVERSION_VALUE = 1;

function generateRefCodeSuffix(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(REF_CODE_LENGTH));
  let out = '';
  for (const byte of bytes) out += REF_CODE_ALPHABET[byte % REF_CODE_ALPHABET.length];
  return out;
}

async function allocateRefCode(db: D1Database): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `SRT-${generateRefCodeSuffix()}`;
    const existing = await db.prepare(`SELECT 1 FROM leads WHERE ref_code = ?`).bind(candidate).first();
    if (!existing) return candidate;
  }
  throw new Error('failed to allocate a unique ref code after 5 attempts');
}

const REF_CODE_FORMAT = /^SRT-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/;

/**
 * Prefers the ref code the client already minted (src/lib/lead-intake.ts) —
 * it was already burned into the LINE prefill URL before this request was
 * even sent, so the server must record the SAME code rather than issue a
 * different one. Only falls back to server-side allocation if the client
 * omitted it or sent something malformed (defensive — e.g. a manual curl
 * test), and only re-rolls on the astronomically unlikely event of a
 * genuine collision (8 chars from a 30-char alphabet).
 */
async function resolveRefCode(db: D1Database, clientRefCode: string | undefined): Promise<string> {
  if (clientRefCode && REF_CODE_FORMAT.test(clientRefCode)) {
    const existing = await db.prepare(`SELECT 1 FROM leads WHERE ref_code = ?`).bind(clientRefCode).first();
    if (!existing) return clientRefCode;
  }
  return allocateRefCode(db);
}

export function extractRefCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = REF_CODE_PATTERN.exec(text);
  return match ? `SRT-${match[1]}` : null;
}

export interface LeadIntakeRequest {
  ref_code?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  lead_persona?: LeadPersona;
  lead_quality_score?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  srt_campaignid?: string;
  srt_adgroupid?: string;
  srt_keyword?: string;
  srt_matchtype?: string;
  srt_device?: string;
  landing_page?: string;
}

/** Mints a lead_id (used as the Data Manager transactionId too — must be stable and unique). */
function generateLeadId(): string {
  return crypto.randomUUID();
}

export async function createLead(env: Env, intake: LeadIntakeRequest): Promise<{ lead_id: string; ref_code: string }> {
  const leadId = generateLeadId();
  const refCode = await resolveRefCode(env.CHAT_DB, intake.ref_code);
  const now = Date.now();

  await env.CHAT_DB.prepare(
    `INSERT INTO leads
       (lead_id, ref_code, created_at, gclid, gbraid, wbraid, lead_persona, lead_quality_score,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        srt_campaignid, srt_adgroupid, srt_keyword, srt_matchtype, srt_device,
        landing_page, attribution_raw, status, status_updated_at, currency, ads_state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, 'THB', ?)`,
  )
    .bind(
      leadId,
      refCode,
      now,
      intake.gclid ?? null,
      intake.gbraid ?? null,
      intake.wbraid ?? null,
      intake.lead_persona ?? null,
      intake.lead_quality_score ?? null,
      intake.utm_source ?? null,
      intake.utm_medium ?? null,
      intake.utm_campaign ?? null,
      intake.utm_term ?? null,
      intake.utm_content ?? null,
      intake.srt_campaignid ?? null,
      intake.srt_adgroupid ?? null,
      intake.srt_keyword ?? null,
      intake.srt_matchtype ?? null,
      intake.srt_device ?? null,
      intake.landing_page ?? null,
      JSON.stringify(intake),
      now,
      intake.gclid || intake.gbraid || intake.wbraid ? 'not_sent' : 'skipped',
    )
    .run();

  return { lead_id: leadId, ref_code: refCode };
}

/**
 * Called from the webhook's normalize step when an inbound text message
 * contains a ref code. Binds the lead to the conversation and, if the lead
 * has a click identifier, enqueues the initial ads-sync job. Matching is
 * exact-ref-only and automatic — never inferred from timing, because a
 * wrong automatic match would silently attach a conversion to the wrong
 * gclid (see docs/lead-matching/README.md).
 */
export async function matchLeadByRefCode(
  env: Env,
  refCode: string,
  conversationId: string,
  matchedAt: number,
): Promise<LeadRow | null> {
  const lead = await env.CHAT_DB.prepare(`SELECT * FROM leads WHERE ref_code = ?`).bind(refCode).first<LeadRow>();
  if (!lead || lead.conversation_id) return null; // unknown ref, or already matched (redelivery-safe)

  const personaValue = lead.lead_persona ? PERSONA_VALUES[lead.lead_persona] : null;

  const statements = [
    env.CHAT_DB.prepare(
      `UPDATE leads SET conversation_id = ?, matched_at = ?, match_method = 'ref_code', persona_value = ? WHERE lead_id = ?`,
    ).bind(conversationId, matchedAt, personaValue, lead.lead_id),
    env.CHAT_DB.prepare(
      `INSERT INTO lead_events (lead_id, at, actor, kind, from_value, to_value, reason)
       VALUES (?, ?, 'system', 'match', NULL, ?, 'ref_code found in inbound message')`,
    ).bind(lead.lead_id, matchedAt, conversationId),
  ];

  const hasClickId = Boolean(lead.gclid || lead.gbraid || lead.wbraid);
  let queueMessage: AdsSyncQueueMessage | null = null;

  if (hasClickId) {
    const jobId = crypto.randomUUID();
    statements.push(
      env.CHAT_DB.prepare(
        `INSERT OR IGNORE INTO ads_sync_jobs (job_id, lead_id, created_at, kind, conversion_value, currency, mode, state, attempts)
         VALUES (?, ?, ?, 'initial', ?, 'THB', ?, 'pending', 0)`,
      ).bind(jobId, lead.lead_id, matchedAt, LINE_MESSAGE_CONVERSION_VALUE, env.ADS_SYNC_MODE),
    );
    queueMessage = { jobId };
  }

  await env.CHAT_DB.batch(statements);
  if (queueMessage) await env.ADS_QUEUE.send(queueMessage);

  return lead;
}

export interface LeadUpdateResult {
  ok: boolean;
  error?: string;
}

export async function updateLeadStatus(
  env: Env,
  leadId: string,
  status: LeadStatus,
  actor: string,
  reason: string | null,
): Promise<LeadUpdateResult> {
  const lead = await env.CHAT_DB.prepare(`SELECT * FROM leads WHERE lead_id = ?`).bind(leadId).first<LeadRow>();
  if (!lead) return { ok: false, error: 'lead not found' };

  const now = Date.now();
  await env.CHAT_DB.batch([
    env.CHAT_DB.prepare(`UPDATE leads SET status = ?, status_updated_at = ? WHERE lead_id = ?`).bind(
      status,
      now,
      leadId,
    ),
    env.CHAT_DB.prepare(
      `INSERT INTO lead_events (lead_id, at, actor, kind, from_value, to_value, reason) VALUES (?, ?, ?, 'status_change', ?, ?, ?)`,
    ).bind(leadId, now, actor, lead.status, status, reason),
  ]);

  return { ok: true };
}

/**
 * Sets estimated/actual value and enqueues a Data Manager restatement using
 * the SAME transactionId (lead_id) as the initial conversion — Data Manager
 * treats a repeated transactionId as a value update, not a new conversion.
 * Refuses to restate to 0 (see PERSONA_VALUES comment) since that
 * permanently retracts the conversion in Google Ads.
 */
export async function updateLeadValue(
  env: Env,
  leadId: string,
  value: number,
  valueField: 'estimated_value' | 'actual_value',
  actor: string,
  reason: string | null,
): Promise<LeadUpdateResult> {
  if (value <= 0) {
    return { ok: false, error: 'value must be greater than 0 — a Data Manager restatement to 0 permanently retracts the conversion' };
  }

  const lead = await env.CHAT_DB.prepare(`SELECT * FROM leads WHERE lead_id = ?`).bind(leadId).first<LeadRow>();
  if (!lead) return { ok: false, error: 'lead not found' };

  const now = Date.now();
  const previousValue = valueField === 'actual_value' ? lead.actual_value : lead.estimated_value;

  const statements = [
    env.CHAT_DB.prepare(`UPDATE leads SET ${valueField} = ? WHERE lead_id = ?`).bind(value, leadId),
    env.CHAT_DB.prepare(
      `INSERT INTO lead_events (lead_id, at, actor, kind, from_value, to_value, reason) VALUES (?, ?, ?, 'value_change', ?, ?, ?)`,
    ).bind(leadId, now, actor, previousValue === null ? null : String(previousValue), String(value), reason),
  ];

  const hasClickId = Boolean(lead.gclid || lead.gbraid || lead.wbraid);
  let queueMessage: AdsSyncQueueMessage | null = null;

  // Restate only if an initial conversion job exists for this lead. Checked
  // against ads_sync_jobs directly (not lead.ads_state) because ads_state is
  // only updated once the queue consumer finishes processing the initial
  // job — checking the cached lead field would race with that async step
  // and silently drop the restatement if it ran first.
  const hasInitialJob = hasClickId
    ? Boolean(
        await env.CHAT_DB.prepare(`SELECT 1 FROM ads_sync_jobs WHERE lead_id = ? AND kind = 'initial' LIMIT 1`)
          .bind(leadId)
          .first(),
      )
    : false;

  if (hasInitialJob) {
    const jobId = crypto.randomUUID();
    statements.push(
      env.CHAT_DB.prepare(
        `INSERT INTO ads_sync_jobs (job_id, lead_id, created_at, kind, conversion_value, currency, mode, state, attempts)
         VALUES (?, ?, ?, 'restatement', ?, ?, ?, 'pending', 0)`,
      ).bind(jobId, leadId, now, value, lead.currency, env.ADS_SYNC_MODE),
    );
    queueMessage = { jobId };
  }

  await env.CHAT_DB.batch(statements);
  if (queueMessage) await env.ADS_QUEUE.send(queueMessage);

  return { ok: true };
}

export async function manualMatchLead(
  env: Env,
  leadId: string,
  conversationId: string,
  actor: string,
): Promise<LeadUpdateResult> {
  const lead = await env.CHAT_DB.prepare(`SELECT * FROM leads WHERE lead_id = ?`).bind(leadId).first<LeadRow>();
  if (!lead) return { ok: false, error: 'lead not found' };
  if (lead.conversation_id) return { ok: false, error: 'lead is already matched' };

  const now = Date.now();
  const personaValue = lead.lead_persona ? PERSONA_VALUES[lead.lead_persona] : null;

  const statements = [
    env.CHAT_DB.prepare(
      `UPDATE leads SET conversation_id = ?, matched_at = ?, match_method = 'manual', persona_value = ? WHERE lead_id = ?`,
    ).bind(conversationId, now, personaValue, leadId),
    env.CHAT_DB.prepare(
      `INSERT INTO lead_events (lead_id, at, actor, kind, to_value, reason) VALUES (?, ?, ?, 'match', ?, 'manual match via dashboard')`,
    ).bind(leadId, now, actor, conversationId),
  ];

  const hasClickId = Boolean(lead.gclid || lead.gbraid || lead.wbraid);
  let queueMessage: AdsSyncQueueMessage | null = null;
  if (hasClickId) {
    const jobId = crypto.randomUUID();
    statements.push(
      env.CHAT_DB.prepare(
        `INSERT OR IGNORE INTO ads_sync_jobs (job_id, lead_id, created_at, kind, conversion_value, currency, mode, state, attempts)
         VALUES (?, ?, ?, 'initial', ?, 'THB', ?, 'pending', 0)`,
      ).bind(jobId, leadId, now, LINE_MESSAGE_CONVERSION_VALUE, env.ADS_SYNC_MODE),
    );
    queueMessage = { jobId };
  }

  await env.CHAT_DB.batch(statements);
  if (queueMessage) await env.ADS_QUEUE.send(queueMessage);

  return { ok: true };
}
