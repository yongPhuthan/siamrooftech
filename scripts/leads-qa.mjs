#!/usr/bin/env node
// Exercises the actual local workerd/D1 boundary; never accepts a remote target.
import assert from 'node:assert/strict';
const args = new Map(process.argv.slice(2).map((arg) => { const split = arg.indexOf('='); return [arg.slice(2, split), arg.slice(split + 1)]; }));
const base = args.get('base') || process.env.LEADS_QA_BASE_URL || 'http://localhost:8788';
const target = new URL(base);
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(target.hostname), 'CRM fixtures may only target a local emulator');
const channel = args.get('channel-secret') || process.env.LINE_CHANNEL_SECRET;
const read = args.get('read-token') || process.env.CHAT_HISTORY_READ_TOKEN;
const write = args.get('write-token') || process.env.CHAT_HISTORY_WRITE_TOKEN;
const intake = args.get('intake-token') || process.env.LEADS_INTAKE_TOKEN;
assert.ok(channel && read && write && intake, 'Configure local fixture channel/read/write/intake tokens');
async function api(path, token = read, body) {
  return fetch(`${base}${path}`, { method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-crm-actor': 'admin:local-qa' },
    body: body === undefined ? undefined : JSON.stringify(body) });
}
const click = { click_id: crypto.randomUUID(), session_id: crypto.randomUUID(), landing_id: 'electric-awning',
  landing_path: '/lp/google-ads/electric-awning', attribution: { gclid: 'fixture-local-gclid', utm_source: 'google', utm_medium: 'cpc' } };
assert.equal((await api('/internal/leads/intake', intake, { ...click, landing_path: '/' })).status, 400);
assert.equal((await api('/internal/leads/intake', read, click)).status, 401);
assert.equal((await api('/internal/leads/intake', intake, click)).status, 201);
assert.equal((await api('/internal/leads/intake', intake, click)).status, 201);
const userId = `Uqa${crypto.randomUUID().replaceAll('-', '').slice(0, 29)}`;
const conversationId = `user:${userId}`;
const event = { type: 'message', timestamp: Date.now(), source: { type: 'user', userId },
  webhookEventId: crypto.randomUUID(), deliveryContext: { isRedelivery: false },
  message: { id: crypto.randomUUID(), type: 'text', text: 'ขอประเมินกันสาดกรุงเทพ' } };
const raw = JSON.stringify({ events: [event] });
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(channel), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw))).toString('base64');
for (let i = 0; i < 2; i++) assert.equal((await fetch(`${base}/line/webhook`, { method: 'POST', headers: { 'x-line-signature': signature }, body: raw })).status, 200);
const leads = await (await api(`/crm/conversations/${encodeURIComponent(conversationId)}`)).json();
assert.equal(leads.length, 1); let lead = leads[0]; assert.equal(lead.first_message_at, event.timestamp);
let detail = await (await api(`/crm/leads/${lead.lead_id}`)).json();
assert.equal(detail.jobs.length, 0, 'matching must not enqueue a placeholder');
// Other local QA users can compete for the same timestamp; choose the known fixture click explicitly.
assert.equal((await api(`/crm/leads/${lead.lead_id}/match`, write, { revision: lead.revision, click_id: click.click_id })).status, 200);
lead = (await (await api(`/crm/leads/${lead.lead_id}`)).json()).lead;
const settings = await (await api('/crm/valuations')).json();
const setting = settings.find((version) => version.stage === 'qualified' && version.enabled);
const probability = setting?.probability ?? .25;
const review = { revision: lead.revision, stage: 'qualified', service: 'pass', area: 'pass', intent: 'pass', reason: 'local QA fixture',
  probability, expected_profit: 4000, value: null, actual_profit: null, valuation_version_id: setting?.id ?? null,
  approve: true, confirm_match: true, confirm_final_zero: false };
assert.equal((await api(`/crm/leads/${lead.lead_id}/review`, write, review)).status, 200);
assert.equal((await api(`/crm/leads/${lead.lead_id}/review`, write, review)).status, 409);
detail = await (await api(`/crm/leads/${lead.lead_id}`)).json();
assert.equal(detail.jobs.length, 1); assert.equal(detail.jobs[0].mode, 'dry_run');
const payload = JSON.parse(detail.jobs[0].payload_snapshot);
assert.equal(payload.events[0].conversionValue, Math.round(probability * 4000 * 100) / 100);
assert.equal(payload.events[0].eventTimestamp, new Date(event.timestamp).toISOString());
const download = await api(`/crm/export?days=1&format=jsonl&conversation_id=${encodeURIComponent(conversationId)}`);
assert.equal(download.status, 200); const lines = (await download.text()).trim().split('\n');
assert.equal(lines.length, 2); assert.equal(JSON.parse(lines[1]).text, event.message.text);
assert.equal((await api(`/leads/${lead.lead_id}/value`, write, { value: 99999 })).status, 409);
assert.equal((await fetch(`${base}/crm/leads`)).status, 401);
console.log('Local CRM QA passed: intake registry/auth, signed webhook dedupe, first message, matching, review CAS, immutable dry-run payload, export, legacy write rejection.');
