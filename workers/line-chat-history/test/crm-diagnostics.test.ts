import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './d1-fixture';
import { ensureOpportunity, getCrmLead, recordTouch, saveReview } from '../src/crm';
import { processAdsSyncJob, processAdsDiagnostics } from '../src/ads-sync';

test('acceptance is not success; diagnostics confirms values and terminal zero cannot be restored', async (t) => {
  const f = fixture(); t.after(f.close);
  let clock = Date.UTC(2026, 9, 17, 9); t.mock.method(Date, 'now', () => clock);
  f.env.CRM_ADS_LIVE_ENABLED = 'true'; f.env.ADS_SYNC_MODE = 'live';
  f.env.GOOGLE_SA_CLIENT_EMAIL = 'fixture@example.invalid';
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const bytes = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  f.env.GOOGLE_SA_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(bytes).toString('base64')}\n-----END PRIVATE KEY-----`;
  let ingestions = 0;
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = String(input);
    if (url.includes('oauth2.googleapis.com/token')) return Response.json({ access_token: 'fixture-access-token', expires_in: 3600 });
    if (url.includes('events:ingest')) { ingestions++; return Response.json({ requestId: `fixture-request-${ingestions}` }); }
    if (url.includes('requestStatus:retrieve')) return Response.json({ requestStatusPerDestination: [{ requestStatus: 'SUCCESS' }] });
    throw new Error('unexpected fixture request');
  });
  await recordTouch(f.env, { click_id: crypto.randomUUID(), session_id: crypto.randomUUID(), landing_id: 'electric-awning',
    landing_path: '/lp/google-ads/electric-awning', attribution: { gclid: 'fixture' } });
  f.sqlite.prepare(`INSERT INTO conversations (conversation_id, source_type) VALUES ('user:diagnostics', 'user')`).run();
  f.sqlite.prepare(`INSERT INTO messages (message_id, conversation_id, direction, actor, message_type, payload, occurred_at, created_at)
    VALUES ('diagnostics-message', 'user:diagnostics', 'inbound', 'user', 'text', '{}', ?, ?)`).run(clock + 1000, clock);
  await ensureOpportunity(f.env, 'user:diagnostics');
  const lead = await getCrmLead(f.env, String(f.sqlite.prepare('SELECT lead_id FROM leads').get()!.lead_id));
  const review = { revision: lead.revision, stage: 'qualified', service: 'pass', area: 'pass', intent: 'pass', reason: 'fixture',
    probability: .25, expected_profit: 4800, value: null, actual_profit: null, valuation_version_id: null,
    approve: true, confirm_match: true, confirm_final_zero: false };
  const initial = await saveReview(f.env, lead.lead_id, review, 'admin:fixture');
  const firstJob = String(f.sqlite.prepare('SELECT job_id FROM ads_sync_jobs').get()!.job_id);
  await Promise.all([processAdsSyncJob(firstJob, f.env), processAdsSyncJob(firstJob, f.env)]);
  assert.equal(ingestions, 1, 'lease suppresses concurrent ingestion');
  assert.equal(f.sqlite.prepare('SELECT state FROM ads_sync_jobs').get()!.state, 'ingest_accepted');
  assert.equal(f.sqlite.prepare('SELECT ads_last_value FROM leads').get()!.ads_last_value, null);
  clock += 31 * 60_000; await processAdsDiagnostics(f.env);
  assert.equal(f.sqlite.prepare('SELECT state FROM ads_sync_jobs').get()!.state, 'succeeded');
  const zero = await saveReview(f.env, lead.lead_id, { ...review, revision: initial.revision, stage: 'lost', value: 0, confirm_final_zero: true }, 'admin:fixture');
  const job = String(f.sqlite.prepare('SELECT job_id FROM ads_sync_jobs ORDER BY sequence DESC LIMIT 1').get()!.job_id);
  await processAdsSyncJob(job, f.env); clock += 31 * 60_000; await processAdsDiagnostics(f.env);
  assert.equal(f.sqlite.prepare('SELECT state FROM crm_conversion_records').get()!.state, 'retracted');
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...review, revision: zero.revision }, 'admin:fixture'), /ถูกถอน/);
  assert.equal(ingestions, 2);
});
