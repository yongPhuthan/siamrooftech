#!/usr/bin/env node
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const url = process.env.LINE_WORKER_SMOKE_URL;
const token = process.env.CHAT_HISTORY_READ_TOKEN;
assert.ok(url && token, 'LINE smoke URL/read token required');
const headers = { authorization: `Bearer ${token}` };
if (process.env.CF_ACCESS_CLIENT_ID) headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
if (process.env.CF_ACCESS_CLIENT_SECRET) headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
const response = await fetch(`${url.replace(/\/$/, '')}/chat-history/health`, { headers, redirect: 'manual' });
assert.equal(response.status, 200, 'LINE health/access failed');
const health = await response.json();
assert.equal(health.status, 'ok');
assert.equal(health.release_sha, process.env.GITHUB_SHA, 'deployed LINE SHA mismatch');
for (const path of ['/crm/summary', '/crm/valuations']) {
  const check = await fetch(`${url.replace(/\/$/, '')}${path}`, { headers, redirect: 'manual' });
  assert.equal(check.status, 200, 'reviewed CRM schema/API not ready');
  assert.ok(Array.isArray(await check.json()));
}
writeFileSync('.line-staging-verified.json', JSON.stringify({ verified_sha: health.release_sha, at: new Date().toISOString() }));
console.log('Authenticated LINE D1/health and release SHA verified.');
