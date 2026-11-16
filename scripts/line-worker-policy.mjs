#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readConfig } from './deployment-policy.mjs';

export function lineTarget(config, target, confirmedName) {
  assert.ok(['local', 'staging', 'production'].includes(target), 'unknown LINE target');
  const env = config.env?.[target];
  assert.ok(env, 'explicit LINE environment required');
  const suffix = target === 'production' ? '' : `-${target}`;
  assert.equal(env.name, `siamrooftech-line-chat-history${suffix}`);
  const db = env.d1_databases?.find((item) => item.binding === 'CHAT_DB');
  const bucket = env.r2_buckets?.find((item) => item.binding === 'CHAT_MEDIA');
  assert.equal(db?.database_name, `siamrooftech-line-chat${suffix}`);
  assert.equal(bucket?.bucket_name, `siamrooftech-line-chat-media${suffix}`);
  if (confirmedName !== undefined) assert.equal(confirmedName, db.database_name, 'exact LINE database confirmation mismatch');
  assert.equal(env.vars?.CRM_ADS_LIVE_ENABLED, 'false', 'reviewed CRM must ship with live sync disabled');
  for (const group of ['d1_databases', 'r2_buckets']) {
    for (const binding of env[group]) assert.notEqual(binding.remote, true, 'local validation must never silently access remote resources');
  }
  for (const base of ['line-ads-sync', 'line-media-fetch']) {
    assert.ok(env.queues?.consumers?.some((item) => item.queue === `${base}${suffix}`), 'isolated queue consumer missing');
    assert.ok(env.queues?.producers?.some((item) => item.queue === `${base}${suffix}`), 'isolated queue producer missing');
  }
  return { env, databaseName: db.database_name };
}
export function verifyLineIsolation(config) {
  for (const target of ['local', 'staging', 'production']) lineTarget(config, target);
  const ids = ['local', 'staging', 'production'].map((target) => config.env[target].d1_databases[0].database_id);
  assert.equal(new Set(ids).size, 3, 'LINE database IDs must be isolated');
}
if (process.argv[1]?.endsWith('/line-worker-policy.mjs')) {
  const config = readConfig('workers/line-chat-history/wrangler.jsonc');
  verifyLineIsolation(config);
  const [target, confirmedName] = process.argv.slice(2);
  if (target) lineTarget(config, target, confirmedName);
  console.log('LINE release policy passed: isolated targets and queues, explicit database confirmation, live sync disabled.');
}
