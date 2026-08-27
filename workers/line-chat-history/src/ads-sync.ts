import { getGoogleAccessToken } from './google-auth';
import type { AdsSyncJobRow, AdsSyncQueueMessage, Env, LeadRow } from './types';

const DATAMANAGER_INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest';

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
        loginAccount: { accountType: 'GOOGLE_ADS', accountId: env.ADS_CUSTOMER_ID },
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
        eventSource: 'WEB',
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

  if (job.mode === 'dry_run') {
    await succeedJob(env, job, lead, JSON.stringify({ dry_run: true, note: 'not sent to Google' }));
    return;
  }

  // live mode — every credential below is required, not optional.
  const missing = (['ADS_CUSTOMER_ID', 'ADS_CONVERSION_ACTION_ID', 'GOOGLE_SA_CLIENT_EMAIL', 'GOOGLE_SA_PRIVATE_KEY'] as const).filter(
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

  await succeedJob(env, job, lead, responseText);
}

async function succeedJob(env: Env, job: AdsSyncJobRow, lead: LeadRow, responseBody: string): Promise<void> {
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

async function failJob(env: Env, job: AdsSyncJobRow, error: string): Promise<void> {
  await env.CHAT_DB.prepare(`UPDATE ads_sync_jobs SET state = 'failed', error = ? WHERE job_id = ?`)
    .bind(error, job.job_id)
    .run();
  await env.CHAT_DB.prepare(`UPDATE leads SET ads_state = 'failed', ads_last_error = ? WHERE lead_id = ?`)
    .bind(error, job.lead_id)
    .run();
}
