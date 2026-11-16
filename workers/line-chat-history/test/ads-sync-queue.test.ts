import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index';
import { fixture } from './d1-fixture';
import { recordTouch, ensureOpportunity, saveReview, getCrmLead } from '../src/crm';

for (const queue of ['line-ads-sync', 'line-ads-sync-staging', 'line-ads-sync-local']) {
  test(`${queue} routes reviewed conversions to dry-run without a Google request`, async (t) => {
    const f = fixture(); t.after(f.close);
    const now = Date.now();
    await recordTouch(f.env, { click_id: crypto.randomUUID(), session_id: crypto.randomUUID(), landing_id: 'electric-awning',
      landing_path: '/lp/google-ads/electric-awning', attribution: { gclid: 'fixture' } });
    f.sqlite.prepare(`INSERT INTO conversations (conversation_id, source_type) VALUES ('user:queue', 'user')`).run();
    f.sqlite.prepare(`INSERT INTO messages (message_id, conversation_id, direction, actor, message_type, payload, occurred_at, created_at)
      VALUES ('queue-message', 'user:queue', 'inbound', 'user', 'text', '{}', ?, ?)`).run(now + 1000, now);
    await ensureOpportunity(f.env, 'user:queue');
    const lead = await getCrmLead(f.env, String(f.sqlite.prepare('SELECT lead_id FROM leads').get()!.lead_id));
    await saveReview(f.env, lead.lead_id, { revision: lead.revision, stage: 'qualified', service: 'pass', area: 'pass', intent: 'pass',
      reason: 'fixture', probability: .25, expected_profit: 2000, value: null, actual_profit: null, valuation_version_id: null,
      approve: true, confirm_match: true, confirm_final_zero: false }, 'admin:fixture');
    const job = f.sqlite.prepare('SELECT job_id FROM ads_sync_jobs').get()!;
    // Simulate an old live-mode secret/job. The independent release gate still wins.
    f.env.ADS_SYNC_MODE = 'live'; f.sqlite.prepare("UPDATE ads_sync_jobs SET mode = 'live'").run();
    t.mock.method(globalThis, 'fetch', async () => assert.fail('dry-run must not contact Google'));
    let acked = 0;
    await worker.queue({ queue, messages: [{ body: { jobId: String(job.job_id) }, attempts: 1,
      ack() { acked++; }, retry() { assert.fail('reviewed dry-run must not retry'); } }] } as any, f.env);
    assert.equal(acked, 1); assert.equal(f.sqlite.prepare('SELECT ads_state FROM leads').get()!.ads_state, 'dry_run');
    const payload = JSON.parse(String(f.sqlite.prepare('SELECT request_payload FROM ads_sync_jobs').get()!.request_payload));
    assert.equal(payload.events[0].eventTimestamp, new Date(now + 1000).toISOString());
    assert.equal(payload.events[0].eventSource, 'MESSAGE');
  });
}
test('legacy pending jobs are quarantined instead of being uploaded', async (t) => {
  const f = fixture(); t.after(f.close);
  f.sqlite.prepare(`INSERT INTO leads (lead_id, ref_code, created_at, currency) VALUES ('legacy', 'SRT-OLD', ?, 'THB')`).run(Date.now());
  f.sqlite.prepare(`INSERT INTO ads_sync_jobs (job_id, lead_id, created_at, kind, conversion_value, currency, mode, state)
    VALUES ('legacy-job', 'legacy', ?, 'initial', 1, 'THB', 'live', 'pending')`).run(Date.now());
  t.mock.method(globalThis, 'fetch', async () => assert.fail('legacy must never upload'));
  await worker.queue({ queue: 'line-ads-sync', messages: [{ body: { jobId: 'legacy-job' }, attempts: 1, ack() {}, retry() { assert.fail(); } }] } as any, f.env);
  assert.equal(f.sqlite.prepare('SELECT state FROM ads_sync_jobs').get()!.state, 'failed');
});
