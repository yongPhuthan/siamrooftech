import type { Env } from './types';

/** Queue is a wakeup; the D1 outbox is the durable source of truth. */
export async function dispatchCrmOutbox(env: Env): Promise<void> {
  const now = Date.now();
  const rows = await env.CHAT_DB.prepare(`SELECT j.job_id FROM ads_sync_jobs j
    WHERE j.review_id IS NOT NULL AND j.state = 'pending' AND j.lease_until < ?
    AND (j.last_dispatch_at IS NULL OR j.last_dispatch_at < ?)
    AND NOT EXISTS (SELECT 1 FROM ads_sync_jobs p WHERE p.lead_id = j.lead_id
      AND p.review_id IS NOT NULL AND p.sequence < j.sequence AND p.state != 'succeeded')
    ORDER BY j.created_at, j.job_id LIMIT 25`).bind(now, now - 5 * 60_000).all<{ job_id: string }>();
  for (const job of rows.results) {
    try {
      await env.ADS_QUEUE.send({ jobId: job.job_id });
      await env.CHAT_DB.prepare('UPDATE ads_sync_jobs SET last_dispatch_at = ? WHERE job_id = ?').bind(now, job.job_id).run();
    } catch { console.error('CRM outbox dispatch failed', job.job_id); }
  }
}
