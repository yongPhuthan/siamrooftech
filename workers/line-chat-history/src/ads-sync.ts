import { getGoogleAccessToken } from './google-auth';
import { classifyDiagnostics } from './chat-domain';
import type { AdsSyncJobRow, AdsSyncQueueMessage, Env, LeadRow } from './types';

const DATAMANAGER_INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest';
const DATAMANAGER_STATUS_URL = 'https://datamanager.googleapis.com/v1/requestStatus:retrieve';
const FIRST_DIAGNOSTICS_DELAY_MS = 30 * 60 * 1000;
const DIAGNOSTICS_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// Must match queues.consumers[line-ads-sync].max_retries in wrangler.jsonc.
const MAX_QUEUE_ATTEMPTS = 5;

export async function processAdsSyncQueueBatch(
  batch: MessageBatch<AdsSyncQueueMessage>,
  env: Env,
): Promise<void> {
  for (const message of batch.messages) {
    try {
      await processAdsSyncJob(message.body.jobId, env);
      message.ack();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('ads sync job failed', message.body.jobId, errorMessage);

      if (message.attempts >= MAX_QUEUE_ATTEMPTS) {
        await env.CHAT_DB.prepare(`UPDATE ads_sync_jobs SET state = 'failed', error = ? WHERE job_id = ?`)
          .bind(errorMessage, message.body.jobId)
          .run()
          .catch((dbError) => console.error('failed to record ads sync failure', dbError));

        const job = await env.CHAT_DB.prepare(`SELECT lead_id FROM ads_sync_jobs WHERE job_id = ?`)
          .bind(message.body.jobId)
          .first<{ lead_id: string }>();
        if (job) {
          await env.CHAT_DB.prepare(`UPDATE leads SET ads_state = 'failed', ads_last_error = ? WHERE lead_id = ?`)
            .bind(errorMessage, job.lead_id)
            .run()
            .catch((dbError) => console.error('failed to record lead ads failure', dbError));
        }
      }

      message.retry();
    }
  }
}

/**
 * "dry_run" (the default until a real Google Ads account/conversion action
 * exists — see docs/lead-matching/README.md) never calls Google at all: it
 * only builds and records the exact request payload that WOULD be sent, so
 * the whole pipeline (matching -> value decision -> payload construction)
 * can be exercised and inspected safely.
 *
 * "live" calls Data Manager's events:ingest for real and requires
 * ADS_CUSTOMER_ID / ADS_CONVERSION_ACTION_ID / GOOGLE_SA_CLIENT_EMAIL /
 * GOOGLE_SA_PRIVATE_KEY to all be set — a missing value in live mode is a
 * configuration error, not a soft skip, so the job fails and retries.
 */
export function buildDataManagerPayload(
  lead: LeadRow,
  conversionValue: number,
  currency: string,
  env: Env,
) {
  const adIdentifiers: Record<string, string> = {};
  if (lead.gclid) adIdentifiers.gclid = lead.gclid;
  if (lead.gbraid) adIdentifiers.gbraid = lead.gbraid;
  if (lead.wbraid) adIdentifiers.wbraid = lead.wbraid;

  return {
    destinations: [
      {
        operatingAccount: { accountType: 'GOOGLE_ADS', accountId: env.ADS_CUSTOMER_ID },
        loginAccount: { accountType: 'GOOGLE_ADS', accountId: env.ADS_LOGIN_CUSTOMER_ID },
        productDestinationId: env.ADS_CONVERSION_ACTION_ID,
      },
    ],
    events: [
      {
        eventTimestamp: new Date(lead.created_at).toISOString(),
        transactionId: lead.lead_id,
        conversionValue,
        currency,
        adIdentifiers,
        eventSource: 'MESSAGE',
      },
    ],
  };
}

export async function processAdsSyncJob(jobId: string, env: Env): Promise<void> {
  const job = await env.CHAT_DB.prepare(`SELECT * FROM ads_sync_jobs WHERE job_id = ?`)
    .bind(jobId)
    .first<AdsSyncJobRow>();
  if (!job) {
    console.error('ads sync job not found', jobId);
    return;
  }
  if (job.state !== 'pending') {
    return; // already handled (e.g. redelivered after we already succeeded)
  }

  const lead = await env.CHAT_DB.prepare(`SELECT * FROM leads WHERE lead_id = ?`)
    .bind(job.lead_id)
    .first<LeadRow>();
  if (!lead) {
    await failJob(env, job, 'lead not found');
    return;
  }

  const payload = buildDataManagerPayload(lead, job.conversion_value, job.currency, env);
  await env.CHAT_DB.prepare(`UPDATE ads_sync_jobs SET request_payload = ?, attempts = attempts + 1 WHERE job_id = ?`)
    .bind(JSON.stringify(payload), jobId)
    .run();

  // Deployment-level dry-run is a cutover safety gate. A queued job can retain
  // `live` from an earlier deployment, but must never be sent until the current
  // Worker configuration is explicitly restored to live after validation.
  if (env.ADS_SYNC_MODE !== 'live' || job.mode === 'dry_run') {
    await completeDryRun(env, job, lead, JSON.stringify({ dry_run: true, note: 'not sent to Google' }));
    return;
  }

  // live mode — every credential below is required, not optional.
  const missing = (['ADS_CUSTOMER_ID', 'ADS_LOGIN_CUSTOMER_ID', 'ADS_CONVERSION_ACTION_ID', 'GOOGLE_SA_CLIENT_EMAIL', 'GOOGLE_SA_PRIVATE_KEY'] as const).filter(
    (key) => !env[key],
  );
  if (missing.length > 0) {
    throw new Error(`ads sync in live mode but missing config: ${missing.join(', ')}`);
  }

  const accessToken = await getGoogleAccessToken(env.GOOGLE_SA_CLIENT_EMAIL, env.GOOGLE_SA_PRIVATE_KEY);
  const res = await fetch(DATAMANAGER_INGEST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(`Data Manager ingest failed (${res.status}): ${responseText}`);
  }

  let response: { requestId?: string };
  try {
    response = JSON.parse(responseText);
  } catch {
    throw new Error('Data Manager ingest returned invalid JSON');
  }
  if (!response.requestId) throw new Error('Data Manager ingest response did not include requestId');

  const now = Date.now();
  await env.CHAT_DB.batch([
    env.CHAT_DB.prepare(
      `UPDATE ads_sync_jobs SET state = 'ingest_accepted', response_body = ?, google_request_id = ?,
       first_accepted_at = ?, next_check_at = ?, error = NULL WHERE job_id = ?`,
    ).bind(responseText, response.requestId, now, now + FIRST_DIAGNOSTICS_DELAY_MS, job.job_id),
    env.CHAT_DB.prepare(
      `UPDATE leads SET ads_state = 'ingest_accepted', ads_last_error = NULL WHERE lead_id = ?`,
    ).bind(lead.lead_id),
    env.CHAT_DB.prepare(
      `INSERT INTO ads_sync_attempts
       (job_id, lead_id, attempted_at, kind, outcome, google_request_id, request_payload, response_body)
       VALUES (?, ?, ?, 'ingest', 'accepted', ?, ?, ?)`,
    ).bind(job.job_id, lead.lead_id, now, response.requestId, JSON.stringify(payload), responseText),
  ]);
}

async function completeDryRun(env: Env, job: AdsSyncJobRow, lead: LeadRow, responseBody: string): Promise<void> {
  const now = Date.now();
  await env.CHAT_DB.batch([
    env.CHAT_DB.prepare(
      `UPDATE ads_sync_jobs SET state = 'succeeded', response_body = ?, completed_at = ? WHERE job_id = ?`,
    ).bind(responseBody, now, job.job_id),
    env.CHAT_DB.prepare(
      `UPDATE leads SET ads_state = ?, ads_last_value = ?, ads_last_sent_at = ?, ads_last_error = NULL WHERE lead_id = ?`,
    ).bind(job.kind === 'initial' ? 'sent' : 'restated', job.conversion_value, now, lead.lead_id),
    env.CHAT_DB.prepare(
      `INSERT INTO lead_events (lead_id, at, actor, kind, from_value, to_value, reason, payload)
       VALUES (?, ?, 'system', 'ads_sync', ?, ?, ?, ?)`,
    ).bind(
      lead.lead_id,
      now,
      job.kind === 'restatement' ? String(lead.ads_last_value ?? '') : null,
      String(job.conversion_value),
      `${job.mode}:${job.kind}`,
      responseBody,
    ),
  ]);
}

interface DiagnosticsResponse {
  requestStatusPerDestination?: Array<{
    requestStatus?: string;
    errorInfo?: { errorCounts?: Array<{ recordCount?: string; reason?: string }> };
    warningInfo?: { warningCounts?: Array<{ recordCount?: string; reason?: string }> };
    eventsIngestionStatus?: { recordCount?: string };
    [key: string]: unknown;
  }>;
}

function diagnosticsDelay(checkCount: number): number {
  return Math.min(FIRST_DIAGNOSTICS_DELAY_MS * 2 ** Math.max(0, checkCount - 1), 6 * 60 * 60 * 1000);
}

export async function processAdsDiagnostics(env: Env): Promise<void> {
  const now = Date.now();
  const rows = await env.CHAT_DB.prepare(
    `SELECT * FROM ads_sync_jobs
     WHERE state IN ('ingest_accepted', 'processing') AND next_check_at <= ?
     ORDER BY next_check_at ASC LIMIT 25`,
  ).bind(now).all<AdsSyncJobRow>();

  for (const job of rows.results ?? []) {
    await checkDiagnosticsJob(env, job, now).catch(async (error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Data Manager diagnostics failed', job.job_id, message);
      const failures = await env.CHAT_DB.prepare(
        `SELECT COUNT(*) AS count FROM ads_sync_attempts WHERE job_id = ? AND kind = 'diagnostics'`,
      ).bind(job.job_id).first<{ count: number }>();
      const failedAt = Date.now();
      await env.CHAT_DB.batch([
        env.CHAT_DB.prepare(
          `INSERT INTO ads_sync_attempts (job_id, lead_id, attempted_at, kind, outcome, google_request_id, error)
           VALUES (?, ?, ?, 'diagnostics', 'request_failed', ?, ?)`,
        ).bind(job.job_id, job.lead_id, failedAt, job.google_request_id, message),
        env.CHAT_DB.prepare(`UPDATE ads_sync_jobs SET next_check_at = ? WHERE job_id = ?`).bind(
          failedAt + diagnosticsDelay(Number(failures?.count ?? 0) + 1),
          job.job_id,
        ),
      ]);
    });
  }
}

async function checkDiagnosticsJob(env: Env, job: AdsSyncJobRow, now: number): Promise<void> {
  if (!job.google_request_id || !job.first_accepted_at) return;
  if (now - job.first_accepted_at >= DIAGNOSTICS_TIMEOUT_MS) {
    await env.CHAT_DB.batch([
      env.CHAT_DB.prepare(
        `UPDATE ads_sync_jobs SET state = 'failed', error = 'diagnostics timeout after 24 hours', completed_at = ?, last_checked_at = ? WHERE job_id = ?`,
      ).bind(now, now, job.job_id),
      env.CHAT_DB.prepare(`UPDATE leads SET ads_state = 'failed', ads_last_error = 'Google diagnostics timeout' WHERE lead_id = ?`).bind(job.lead_id),
    ]);
    return;
  }

  const accessToken = await getGoogleAccessToken(env.GOOGLE_SA_CLIENT_EMAIL, env.GOOGLE_SA_PRIVATE_KEY);
  const response = await fetch(`${DATAMANAGER_STATUS_URL}?requestId=${encodeURIComponent(job.google_request_id)}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const responseText = await response.text();
  if (!response.ok) throw new Error(`requestStatus failed (${response.status}): ${responseText}`);
  const diagnostics = JSON.parse(responseText) as DiagnosticsResponse;
  const destinations = diagnostics.requestStatusPerDestination ?? [];
  const state = classifyDiagnostics(destinations);
  const checkCount = await env.CHAT_DB.prepare(
    `SELECT COUNT(*) AS count FROM ads_sync_attempts WHERE job_id = ? AND kind = 'diagnostics'`,
  ).bind(job.job_id).first<{ count: number }>();

  const attempt = env.CHAT_DB.prepare(
    `INSERT INTO ads_sync_attempts
     (job_id, lead_id, attempted_at, kind, outcome, google_request_id, response_body)
     VALUES (?, ?, ?, 'diagnostics', ?, ?, ?)`,
  ).bind(job.job_id, job.lead_id, now, state, job.google_request_id, responseText);

  if (state === 'processing') {
    await env.CHAT_DB.batch([
      attempt,
      env.CHAT_DB.prepare(
        `UPDATE ads_sync_jobs SET state = 'processing', last_checked_at = ?, diagnostics_json = ?, next_check_at = ? WHERE job_id = ?`,
      ).bind(now, responseText, now + diagnosticsDelay(Number(checkCount?.count ?? 0) + 1), job.job_id),
      env.CHAT_DB.prepare(`UPDATE leads SET ads_state = 'processing' WHERE lead_id = ?`).bind(job.lead_id),
    ]);
    return;
  }

  const finalState = state === 'success' ? 'succeeded' : state;
  const error = state === 'failure' || state === 'partial_success' ? responseText : null;
  await env.CHAT_DB.batch([
    attempt,
    env.CHAT_DB.prepare(
      `UPDATE ads_sync_jobs SET state = ?, last_checked_at = ?, diagnostics_json = ?, error = ?, completed_at = ?, next_check_at = NULL WHERE job_id = ?`,
    ).bind(finalState, now, responseText, error, now, job.job_id),
    env.CHAT_DB.prepare(
      `UPDATE leads SET ads_state = ?, ads_last_value = ?, ads_last_sent_at = ?, ads_last_error = ? WHERE lead_id = ?`,
    ).bind(finalState, job.conversion_value, now, error, job.lead_id),
    env.CHAT_DB.prepare(
      `INSERT INTO lead_events (lead_id, at, actor, kind, from_value, to_value, reason, payload)
       VALUES (?, ?, 'system', 'ads_sync', NULL, ?, 'diagnostics', ?)`,
    ).bind(job.lead_id, now, String(job.conversion_value), responseText),
  ]);
}

async function failJob(env: Env, job: AdsSyncJobRow, error: string): Promise<void> {
  await env.CHAT_DB.prepare(`UPDATE ads_sync_jobs SET state = 'failed', error = ? WHERE job_id = ?`)
    .bind(error, job.job_id)
    .run();
  await env.CHAT_DB.prepare(`UPDATE leads SET ads_state = 'failed', ads_last_error = ? WHERE lead_id = ?`)
    .bind(error, job.lead_id)
    .run();
}
