import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './d1-fixture';
import { adsTouchSchema, bangkokRange, chooseMatch, reviewSchema, reviewValue, reviewProblem } from '../../../src/features/lead-crm/contracts';
import { ensureOpportunity, recordTouch, saveReview, getCrmLead, selectMatch, candidatesFor, createNextOpportunity, createValuation } from '../src/crm';
import { handleCrmApi } from '../src/crm-api';
import { historyPage, handleHistory } from '../src/crm-history';
import { purgeChatHistory } from '../src/crm-retention';
import { dispatchCrmOutbox } from '../src/crm-outbox';
import { processAdsSyncJob } from '../src/ads-sync';
import worker from '../src/index';

const now = Date.UTC(2026, 9, 17, 9);
function touch() { return { click_id: crypto.randomUUID(), session_id: crypto.randomUUID(), landing_id: 'electric-awning',
  landing_path: '/lp/google-ads/electric-awning', attribution: { gclid: 'fixture-gclid', srt_campaignid: 'test-campaign' } }; }
function message(f: ReturnType<typeof fixture>, who: string, at: number, text = 'ขอใบเสนอราคากันสาด', id = crypto.randomUUID()) {
  f.sqlite.prepare(`INSERT OR IGNORE INTO conversations (conversation_id, source_type, first_event_at, last_event_at, display_name)
    VALUES (?, 'user', ?, ?, 'ลูกค้าทดสอบ')`).run(who, at, at);
  f.sqlite.prepare(`INSERT INTO messages (message_id, conversation_id, direction, actor, message_type, text, payload, occurred_at, created_at)
    VALUES (?, ?, 'inbound', 'user', 'text', ?, '{}', ?, ?)`).run(id, who, text, at, Date.now());
  return id;
}
function review(revision: number) { return reviewSchema.parse({ revision, stage: 'qualified', service: 'pass', area: 'pass', intent: 'pass',
  reason: 'บริการและพื้นที่ตรง ยืนยันขอใบเสนอราคา', probability: 0.25, expected_profit: 4000, value: null, actual_profit: null,
  valuation_version_id: null, approve: true, confirm_match: true, confirm_final_zero: false }); }

test('Converted Lead requires sales and actual profit; Google value uses profit rather than sales', async (t) => {
  const f = fixture(); t.after(f.close);
  const { lead } = await matched(f);
  const input = { ...review(lead.revision), stage: 'won', sales_amount: 20000, actual_profit: 3800 };
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...input, sales_amount: null }, 'admin:fixture'), /ยอดขายและกำไรจริง/);
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...input, actual_profit: null }, 'admin:fixture'), /ยอดขายและกำไรจริง/);
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...input, actual_profit: 25000 }, 'admin:fixture'), /ไม่มากกว่ายอดขาย/);
  const saved = await saveReview(f.env, lead.lead_id, input, 'admin:fixture');
  assert.equal(saved.actual_value, 3800);
  assert.equal(JSON.parse(saved.review_json!).sales_amount, 20000);
  const job = f.sqlite.prepare('SELECT * FROM ads_sync_jobs').get()!;
  assert.equal(job.conversion_value, 3800);
  assert.equal(JSON.parse(String(job.payload_snapshot)).events[0].conversionValue, 3800);
  const url = new URL('https://local.test/crm/summary');
  const response = await handleCrmApi(new Request(url, { headers: { authorization: 'Bearer fixture-read' } }), f.env, url);
  const summary = await response.json() as Array<{ sales_amount: number; actual_profit: number }>;
  assert.equal(summary[0].sales_amount, 20000); assert.equal(summary[0].actual_profit, 3800);
});
async function matched(f: ReturnType<typeof fixture>) {
  const t = touch(); await recordTouch(f.env, t);
  message(f, 'user:one', Date.now() + 60_000); await ensureOpportunity(f.env, 'user:one');
  const row = f.sqlite.prepare("SELECT lead_id FROM leads WHERE conversation_id = 'user:one'").get()!;
  return { lead: await getCrmLead(f.env, String(row.lead_id)), touch: t };
}

test('console reports live delivery only when both server gates enable it', async (t) => {
  const f = fixture(); t.after(f.close);
  const url = new URL('https://local.test/crm/health');
  for (const [gate, mode, expected] of [['false', 'live', 'dry_run'], ['true', 'dry_run', 'dry_run'], ['true', 'live', 'live']] as const) {
    f.env.CRM_ADS_LIVE_ENABLED = gate; f.env.ADS_SYNC_MODE = mode;
    const response = await handleCrmApi(new Request(url, { headers: { authorization: 'Bearer fixture-read' } }), f.env, url);
    assert.equal(response.status, 200);
    assert.equal((await response.json() as { delivery_mode: string }).delivery_mode, expected);
  }
});

for (const queueFails of [false, true]) test(`approved HTTP review wakes the Queue after commit; failure=${queueFails} preserves outbox`, async (t) => {
  const f = fixture(); t.after(f.close);
  const { lead } = await matched(f);
  const pending: Promise<unknown>[] = [];
  let sends = 0;
  f.env.ADS_QUEUE.send = async () => { sends++; if (queueFails) throw new Error('fixture unavailable'); };
  t.mock.method(console, 'error', () => {});
  const response = await worker.fetch(new Request(`https://local.test/crm/leads/${lead.lead_id}/review`, {
    method: 'POST', headers: { authorization: 'Bearer fixture-write', 'x-crm-actor': 'admin:fixture', 'content-type': 'application/json' },
    body: JSON.stringify(review(lead.revision)),
  }), f.env, { waitUntil(task: Promise<unknown>) { pending.push(task); } } as ExecutionContext);
  assert.equal(response.status, 200);
  await Promise.all(pending);
  assert.equal(sends, 1);
  const job = f.sqlite.prepare('SELECT * FROM ads_sync_jobs').get()!;
  assert.equal(job.state, 'pending');
  assert.equal(job.last_dispatch_at === null, queueFails);
  assert.equal(f.sqlite.prepare('SELECT review_state FROM leads').get()!.review_state, 'approved');
});

test('landing contract rejects outside routes and arbitrary attribution; blank click ID remains unexportable', () => {
  assert.equal(adsTouchSchema.safeParse({ ...touch(), landing_path: '/' }).success, false);
  assert.equal(adsTouchSchema.safeParse({ ...touch(), attribution: { email: 'forbidden' } }).success, false);
  assert.equal(adsTouchSchema.safeParse({ ...touch(), attribution: {} }).success, true);
});
test('matching is chronological, nearest, tie-safe, and distinguishes secondary/follow candidates', () => {
  const clicks = [{ click_id: 'before', clicked_at: now - 60_000 }, { click_id: 'future', clicked_at: now + 1 }];
  assert.equal(chooseMatch(clicks, now, []).selected?.click_id, 'before');
  assert.equal(chooseMatch([...clicks, { click_id: 'tied', clicked_at: now - 60_000 }], now, []).selected, null);
  assert.equal(chooseMatch([{ click_id: 'slow', clicked_at: now - 20 * 60_000 }], now, []).candidates[0].tier, 'review');
  assert.equal(chooseMatch([{ click_id: 'follow', clicked_at: now - 3 * 86400_000 }], now, [now - 3 * 86400_000 + 60_000]).candidates[0].method, 'follow_timestamp');
  assert.equal(chooseMatch([{ click_id: 'old', clicked_at: now - 31 * 60_000 }], now, []).candidates.length, 0);
});
test('real migrations preserve legacy; click dedupe does not create lead or conversion', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const data = touch(); await recordTouch(f.env, data); await recordTouch(f.env, data);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_touches').get()!.n, 1);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()!.n, 0);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_sync_jobs').get()!.n, 0);
  await assert.rejects(recordTouch(f.env, { ...data, attribution: {} }), /already used/);
});
test('first inbound creates one pending opportunity, matches time, and never sends a placeholder', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const { lead, touch: click } = await matched(f);
  assert.equal(lead.touch_id, click.click_id); assert.equal(lead.first_message_at, now + 60_000);
  assert.equal(lead.status, 'pending'); assert.equal(lead.review_state, 'pending');
  await ensureOpportunity(f.env, 'user:one');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()!.n, 1);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_sync_jobs').get()!.n, 0);
});
test('late intake reconciles persisted LINE event; one click cannot belong to two leads', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  message(f, 'user:one', now + 5000); await ensureOpportunity(f.env, 'user:one');
  assert.equal(f.sqlite.prepare('SELECT touch_id FROM leads').get()!.touch_id, null);
  await recordTouch(f.env, touch());
  message(f, 'user:two', now + 6000); await ensureOpportunity(f.env, 'user:two');
  const rows = f.sqlite.prepare('SELECT touch_id FROM leads ORDER BY first_message_at').all();
  assert.ok(rows[0].touch_id); assert.equal(rows[1].touch_id, null);
});
test('review CAS, gates, immutable snapshots, outbox recovery and restatement use the same conversion', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const { lead } = await matched(f);
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...review(lead.revision), area: 'unknown' }, 'admin:fixture'), /Gate/);
  const saved = await saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:fixture');
  await assert.rejects(saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:fixture'), /โหลดใหม่/);
  const job = f.sqlite.prepare('SELECT * FROM ads_sync_jobs').get()!;
  const payload = JSON.parse(String(job.payload_snapshot));
  assert.equal(payload.events[0].eventTimestamp, new Date(now + 60_000).toISOString());
  assert.equal(payload.events[0].conversionValue, 1000); assert.equal(job.mode, 'dry_run');
  assert.equal(f.queued.length, 0); await dispatchCrmOutbox(f.env); assert.equal(f.queued.length, 1);
  // A later browser/client change cannot change the queued payload.
  f.sqlite.prepare("UPDATE leads SET gclid = 'newer-id' WHERE lead_id = ?").run(lead.lead_id);
  await processAdsSyncJob(String(job.job_id), f.env);
  assert.equal(JSON.parse(String(f.sqlite.prepare('SELECT request_payload FROM ads_sync_jobs').get()!.request_payload)).events[0].adIdentifiers.gclid, 'fixture-gclid');
  assert.equal(f.sqlite.prepare('SELECT ads_state FROM leads').get()!.ads_state, 'dry_run');
  const next = await saveReview(f.env, lead.lead_id, { ...review(saved.revision), stage: 'won', sales_amount: 20000, actual_profit: 3800 }, 'admin:fixture');
  assert.equal(next.actual_value, 3800);
  const jobs = f.sqlite.prepare('SELECT * FROM ads_sync_jobs ORDER BY sequence').all();
  const second = JSON.parse(String(jobs[1].payload_snapshot));
  assert.equal(second.events[0].transactionId, payload.events[0].transactionId);
  assert.equal(second.events[0].conversionValue, 3800); assert.equal(jobs[1].kind, 'restatement');
});
test('pending/unknown/no identifier cannot upload; zero requires explicit terminal confirmation', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const { lead } = await matched(f);
  const draft = { ...review(lead.revision), approve: false, probability: null, expected_profit: null, value: null, stage: 'pending' };
  const saved = await saveReview(f.env, lead.lead_id, draft, 'admin:fixture');
  assert.equal(saved.estimated_value, null); assert.equal(saved.status, 'pending');
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...review(saved.revision), stage: 'lost', probability: null, expected_profit: null, value: 0 }, 'admin:fixture'), /ยืนยัน/);
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...review(saved.revision), stage: 'lost', probability: null, expected_profit: null, value: 0, confirm_final_zero: true }, 'admin:fixture'), /ก่อนส่งครั้งแรก/);
});
test('secondary candidate requires manual selection and review approval; claimed pair cannot change after approval', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const click = touch(); await recordTouch(f.env, click);
  message(f, 'user:slow', now + 20 * 60_000); await ensureOpportunity(f.env, 'user:slow');
  const lead = await getCrmLead(f.env, String(f.sqlite.prepare('SELECT lead_id FROM leads').get()!.lead_id));
  assert.equal(lead.touch_id, null); assert.equal((await candidatesFor(f.env, lead)).candidates.length, 1);
  await selectMatch(f.env, lead.lead_id, lead.revision, click.click_id, 'admin:fixture');
  const current = await getCrmLead(f.env, lead.lead_id); await saveReview(f.env, lead.lead_id, review(current.revision), 'admin:fixture');
  const approved = await getCrmLead(f.env, lead.lead_id);
  await assert.rejects(selectMatch(f.env, lead.lead_id, approved.revision, click.click_id, 'admin:fixture'), /ล็อก/);
});
test('returning messages reuse a closed opportunity; new work must be created explicitly', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const { lead } = await matched(f);
  const closed = await saveReview(f.env, lead.lead_id, { ...review(lead.revision), approve: false, stage: 'lost' }, 'admin:fixture');
  message(f, 'user:one', now + 30 * 86400_000); await ensureOpportunity(f.env, 'user:one');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()!.n, 1);
  const created = await createNextOpportunity(f.env, 'user:one', lead.lead_id, closed.revision, 'admin:fixture', 'คนละงาน');
  assert.equal(created.first_message_at, null); assert.equal(created.touch_id, null);
});
test('formula versions do not revalue old leads or enqueue uploads', async (t) => {
  const f = fixture(); t.after(f.close);
  const first = await createValuation(f.env, { stage: 'qualified', label: 'รุ่นหนึ่ง', probability: 0.15, expected_profit: 4000, enabled: true }, 'admin:fixture');
  await createValuation(f.env, { stage: 'qualified', label: 'รุ่นสอง', probability: 0.2, expected_profit: 4000, enabled: true, supersedes_id: first.id }, 'admin:fixture');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_valuation_versions WHERE enabled = 1').get()!.n, 1);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_sync_jobs').get()!.n, 0);
});
test('Thai substring search, unsent redaction and full streamed export exceed a page', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  for (let i = 0; i < 405; i++) message(f, 'user:export', now - 1000 + i, 'ต้องการกันสาด', `m-${String(i).padStart(4, '0')}`);
  f.sqlite.prepare("UPDATE messages SET is_unsent = 1 WHERE message_id = 'm-0000'").run();
  const url = new URL('https://fixture/crm/messages?days=1&q=กันสาด');
  const page = await historyPage(f.env, url); assert.equal(page.messages.length, 200); assert.ok(page.next_cursor);
  const download = new URL('https://fixture/crm/export?days=1&format=jsonl');
  const text = await (await handleHistory(f.env, download)).text();
  const lines = text.trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(lines.length, 406); assert.equal(lines[1].text, null); assert.equal(lines[405].message_id, 'm-0404');
});
test('calendar bounds use Bangkok midnight; retention deletes R2 and raw copies but preserves outcomes', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  assert.equal(bangkokRange(1, Date.UTC(2026, 9, 17, 0)).from, Date.UTC(2026, 9, 16, 17));
  const at = now - 366 * 86400_000; const id = message(f, 'user:old', at);
  f.sqlite.prepare(`INSERT INTO attachments (message_id, kind, content_provider, status, r2_key) VALUES (?, 'image', 'line', 'stored', 'old-media')`).run(id);
  f.sqlite.prepare(`INSERT INTO webhook_deliveries (id, received_at, signature_ok, event_count, raw_body, status) VALUES (1, ?, 1, 1, 'old-secret-text', 'stored')`).run(at);
  await purgeChatHistory(f.env, now);
  assert.deepEqual(f.deleted, ['old-media']); assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get()!.n, 0);
  assert.equal(f.sqlite.prepare('SELECT raw_body FROM webhook_deliveries').get()!.raw_body, '{}');
  assert.equal(f.sqlite.prepare('SELECT state FROM crm_retention_runs').get()!.state, 'succeeded');
});
test('write/read authorization, spoofed actor and malformed revision are rejected', async (t) => {
  const f = fixture(); t.after(f.close);
  const url = new URL('https://fixture/crm/leads');
  assert.equal((await handleCrmApi(new Request(url), f.env, url)).status, 401);
  const mutation = new URL(`https://fixture/crm/leads/${crypto.randomUUID()}/review`);
  const badActor = new Request(mutation, { method: 'POST', headers: { authorization: 'Bearer fixture-write', 'content-type': 'application/json' }, body: '{}' });
  assert.equal((await handleCrmApi(badActor, f.env, mutation)).status, 403);
  const badReview = new Request(mutation, { method: 'POST', headers: { authorization: 'Bearer fixture-write', 'x-crm-actor': 'admin:verified' }, body: '{}' });
  assert.equal((await handleCrmApi(badReview, f.env, mutation)).status, 400);
});

test('two simultaneous approvals commit one review and one initial job', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const { lead } = await matched(f);
  const outcomes = await Promise.allSettled([
    saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:first'),
    saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:second'),
  ]);
  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_reviews').get()!.n, 1);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_sync_jobs').get()!.n, 1);
});
test('a simulated initial event is not a live baseline or an automatically replayable upload', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const { lead } = await matched(f);
  const saved = await saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:fixture');
  await processAdsSyncJob(String(f.sqlite.prepare('SELECT job_id FROM ads_sync_jobs').get()!.job_id), f.env);
  f.env.CRM_ADS_LIVE_ENABLED = 'true'; f.env.ADS_SYNC_MODE = 'live'; f.env.ADS_CONVERSION_ACTION_ID = 'new-reviewed-action';
  await saveReview(f.env, lead.lead_id, review(saved.revision), 'admin:fixture');
  const jobs = f.sqlite.prepare('SELECT * FROM ads_sync_jobs ORDER BY sequence').all();
  assert.equal(jobs[0].is_simulation, 1); assert.equal(jobs[1].kind, 'initial'); assert.equal(jobs[1].mode, 'live');
  assert.equal(JSON.parse(String(jobs[1].payload_snapshot)).destinations[0].productDestinationId, 'new-reviewed-action');
});
test('failed outbox dispatch preserves the pending approval for retry', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const { lead } = await matched(f); await saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:fixture');
  const original = f.env.ADS_QUEUE.send;
  f.env.ADS_QUEUE.send = async () => { throw new Error('fixture queue failure'); };
  await dispatchCrmOutbox(f.env);
  assert.equal(f.sqlite.prepare('SELECT state, last_dispatch_at FROM ads_sync_jobs').get()!.last_dispatch_at, null);
  f.env.ADS_QUEUE.send = original; await dispatchCrmOutbox(f.env); assert.equal(f.queued.length, 1);
});
test('a missing click identifier remains reviewable but cannot upload', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  await recordTouch(f.env, { ...touch(), attribution: {} }); message(f, 'user:unknown', now + 1000);
  await ensureOpportunity(f.env, 'user:unknown'); const lead = await getCrmLead(f.env, String(f.sqlite.prepare('SELECT lead_id FROM leads').get()!.lead_id));
  await assert.rejects(saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:fixture'), /จับคู่แล้วก่อนส่ง/);
  await saveReview(f.env, lead.lead_id, { ...review(lead.revision), approve: false }, 'admin:fixture');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_reviews').get()!.n, 1);
});
test('follow event anchors a delayed first message but never creates a conversion itself', async (t) => {
  const f = fixture(); t.after(f.close); let clock = now; t.mock.method(Date, 'now', () => clock);
  const click = touch(); await recordTouch(f.env, click);
  f.sqlite.prepare(`INSERT INTO webhook_deliveries (id, received_at, signature_ok, event_count, raw_body, status) VALUES (1, ?, 1, 1, '{}', 'stored')`).run(now);
  f.sqlite.prepare(`INSERT INTO events (webhook_event_id, delivery_id, event_type, occurred_at, conversation_id, source_type, raw_event, received_at)
    VALUES ('follow', 1, 'follow', ?, 'user:follow', 'user', '{}', ?)`).run(now + 1000, now + 1000);
  await ensureOpportunity(f.env, 'user:follow'); assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()!.n, 0);
  clock += 2 * 86400_000; message(f, 'user:follow', clock); await ensureOpportunity(f.env, 'user:follow');
  const lead = await getCrmLead(f.env, String(f.sqlite.prepare('SELECT lead_id FROM leads').get()!.lead_id));
  assert.equal(lead.touch_id, null); assert.equal((await candidatesFor(f.env, lead)).candidates[0].method, 'follow_timestamp');
  await selectMatch(f.env, lead.lead_id, lead.revision, click.click_id, 'admin:fixture');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_sync_jobs').get()!.n, 0);
});
test('stale formula activation cannot overwrite a concurrently changed active version', async (t) => {
  const f = fixture(); t.after(f.close);
  const input = { stage: 'qualified', label: 'one', probability: 0.1, expected_profit: 5000, enabled: true };
  const first = await createValuation(f.env, input, 'admin:first');
  const second = await createValuation(f.env, { ...input, label: 'two', supersedes_id: first.id }, 'admin:second');
  await assert.rejects(createValuation(f.env, { ...input, label: 'stale', supersedes_id: first.id }, 'admin:stale'), /โหลดใหม่/);
  assert.equal(f.sqlite.prepare('SELECT id FROM crm_valuation_versions WHERE enabled = 1').get()!.id, second.id);
});
test('R2 purge failure keeps metadata and records a recoverable failed run', async (t) => {
  const f = fixture(); t.after(f.close); t.mock.method(Date, 'now', () => now);
  const id = message(f, 'user:expired', now - 366 * 86400_000);
  f.sqlite.prepare(`INSERT INTO attachments (message_id, kind, content_provider, status, r2_key) VALUES (?, 'image', 'line', 'stored', 'retry-key')`).run(id);
  const original = f.env.CHAT_MEDIA.delete;
  f.env.CHAT_MEDIA.delete = async () => { throw new Error('fixture failure'); };
  await assert.rejects(purgeChatHistory(f.env, now));
  assert.equal(f.sqlite.prepare('SELECT r2_key FROM attachments').get()!.r2_key, 'retry-key');
  assert.equal(f.sqlite.prepare('SELECT state FROM crm_retention_runs').get()!.state, 'failed');
  f.env.CHAT_MEDIA.delete = original; await purgeChatHistory(f.env, now);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get()!.n, 0);
});
test('recent delivery containing old chat text is redacted using event time', async (t) => {
  const f = fixture(); t.after(f.close);
  f.sqlite.prepare(`INSERT INTO webhook_deliveries (id, received_at, signature_ok, event_count, raw_body, status, retention_event_at)
    VALUES (1, ?, 1, 1, 'old-redelivered-text', 'stored', ?)`).run(now, now - 366 * 86400_000);
  await purgeChatHistory(f.env, now);
  assert.equal(f.sqlite.prepare('SELECT raw_body FROM webhook_deliveries').get()!.raw_body, '{}');
});


test('all four stages use shared fixed probability; browser overrides and manual EV cannot change it', async (t) => {
  const f = fixture(); t.after(f.close);
  let { lead } = await matched(f);
  for (const [stage, probability, expected] of [['pending', .1, 400], ['qualified', .25, 1000],
    ['assessment', .25, 1000], ['quoted', .25, 1000], ['site_visit_completed', .75, 3000], ['won', 1, 3800]] as const) {
    lead = await saveReview(f.env, lead.lead_id, { ...review(lead.revision), stage, approve: false,
      probability: .99, value: 999999, sales_amount: stage === 'won' ? 20000 : null, actual_profit: stage === 'won' ? 3800 : null }, 'admin:fixture');
    assert.equal(JSON.parse(lead.review_json!).probability, probability);
    assert.equal(lead.estimated_value, expected);
  }
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_sync_jobs').get()!.n, 0);
});

test('shared status probability preserves each job profit and requires all gates for a completed visit', async (t) => {
  const f = fixture(); t.after(f.close);
  let { lead } = await matched(f);
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...review(lead.revision), stage: 'site_visit_completed', area: 'unknown', approve: false }, 'admin:fixture'), /Gate/);
  lead = await saveReview(f.env, lead.lead_id, { ...review(lead.revision), approve: false, expected_profit: 8000 }, 'admin:fixture');
  assert.equal(lead.estimated_value, 2000);
  lead = await saveReview(f.env, lead.lead_id, { ...review(lead.revision), approve: false, expected_profit: null, value: 999 }, 'admin:fixture');
  assert.equal(lead.estimated_value, null, 'unknown profit is not replaced by manual EV');
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...review(lead.revision), expected_profit: null, value: 999 }, 'admin:fixture'), /ระบุมูลค่า/);
});

test('changing shared probability leaves old values and queue snapshots intact; stale settings conflict', async (t) => {
  const f = fixture(); t.after(f.close);
  let { lead } = await matched(f);
  lead = await saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:fixture');
  const before = f.sqlite.prepare('SELECT * FROM ads_sync_jobs').get()!;
  const version = await createValuation(f.env, { stage: 'qualified', label: 'ข้อมูลจริงเดือนใหม่', probability: .4, expected_profit: 99999, enabled: true }, 'admin:fixture');
  assert.equal((await getCrmLead(f.env, lead.lead_id)).estimated_value, 1000);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_sync_jobs').get()!.n, 1);
  assert.equal(f.sqlite.prepare('SELECT payload_snapshot FROM ads_sync_jobs').get()!.payload_snapshot, before.payload_snapshot);
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...review(lead.revision), approve: false }, 'admin:fixture'), /โอกาสปิดการขายเปลี่ยน/);
  lead = await saveReview(f.env, lead.lead_id, { ...review(lead.revision), approve: false, valuation_version_id: version.id }, 'admin:fixture');
  assert.equal(lead.estimated_value, 1600, 'uses individual profit, never the legacy formula default profit');
  assert.equal(JSON.parse(lead.review_json!).valuation_version_id, version.id);
  assert.equal(JSON.parse(lead.review_json!).expected_profit, 4000);
  const next = await createValuation(f.env, { stage: 'qualified', label: 'ข้อมูลใหม่อีกครั้ง', probability: .5, enabled: true, supersedes_id: version.id }, 'admin:fixture');
  await assert.rejects(saveReview(f.env, lead.lead_id, { ...review(lead.revision), approve: false, valuation_version_id: version.id }, 'admin:fixture'), /โอกาสปิดการขายเปลี่ยน/);
  const booked = await saveReview(f.env, lead.lead_id, { ...review(lead.revision), stage: 'assessment', approve: false, valuation_version_id: next.id }, 'admin:fixture');
  assert.equal(booked.estimated_value, 2000, 'booked appointment still uses Qualified probability');
});

test('a setting changed between validation and commit cannot save a stale review or enqueue it', async (t) => {
  const f = fixture(); t.after(f.close);
  const { lead } = await matched(f);
  const batch = f.env.CHAT_DB.batch.bind(f.env.CHAT_DB);
  t.mock.method(f.env.CHAT_DB, 'batch', async (statements: D1PreparedStatement[]) => {
    f.sqlite.prepare("INSERT INTO crm_valuation_versions (id, stage, label, probability, expected_profit, enabled, created_at, actor) VALUES (?, 'qualified', 'racing setting', .5, 0, 1, 1, 'admin:fixture')").run(crypto.randomUUID());
    return batch(statements);
  });
  await assert.rejects(saveReview(f.env, lead.lead_id, review(lead.revision), 'admin:fixture'), /โหลดใหม่/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_reviews').get()!.n, 0);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ads_sync_jobs').get()!.n, 0);
});
