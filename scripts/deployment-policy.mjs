#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const EXPECTED = {
  local: { worker: 'siamrooftech-local', origin: 'http://localhost:3000', index: 'noindex' },
  staging: { worker: 'siamrooftech-staging', origin: 'https://staging.siamrooftech.com', index: 'noindex' },
  production: { worker: 'siamrooftech', origin: 'https://www.siamrooftech.com', index: 'index' },
};

export function assessConfig(config, target, { deploy = false, accessReady = false, productionReady = false } = {}) {
  if (!Object.hasOwn(EXPECTED, target)) throw new Error(`Unknown deployment target: ${target}`);
  const expected = EXPECTED[target];
  const env = target === 'local' ? config : config.env?.[target];
  if (!env) throw new Error(`Wrangler target ${target} is missing.`);
  assert.equal(env.name, expected.worker, `${target}: Worker name mismatch`);
  assert.equal(env.vars?.DEPLOY_ENV, target, `${target}: DEPLOY_ENV mismatch`);
  assert.equal(env.vars?.SITE_ORIGIN, expected.origin, `${target}: SITE_ORIGIN mismatch`);
  assert.equal(env.vars?.INDEX_POLICY, expected.index, `${target}: INDEX_POLICY mismatch`);
  if (target === 'production' && deploy && !productionReady) {
    throw new Error('Production cutover is not authorized yet: complete the data, media, backup, routing, and rollback readiness checks first.');
  }

  const d1 = env.d1_databases || [];
  const buckets = env.r2_buckets || [];
  const services = env.services || [];
  const requiredD1 = ['APP_DB', 'NEXT_TAG_CACHE_D1'];
  const requiredR2 = ['MEDIA_BUCKET', 'NEXT_INC_CACHE_R2_BUCKET'];
  const missing = [
    ...requiredD1.filter((binding) => !d1.some((item) => item.binding === binding)),
    ...requiredR2.filter((binding) => !buckets.some((item) => item.binding === binding)),
    ...(!services.some((item) => item.binding === 'WORKER_SELF_REFERENCE') ? ['WORKER_SELF_REFERENCE'] : []),
    ...(!(env.send_email || []).some((item) => item.name === 'AUTH_EMAIL') ? ['AUTH_EMAIL'] : []),
    ...(!(env.assets?.binding === 'ASSETS') ? ['ASSETS'] : []),
    ...(!(env.durable_objects?.bindings || []).some((item) => item.name === 'NEXT_CACHE_DO_QUEUE') ? ['NEXT_CACHE_DO_QUEUE'] : []),
  ];
  if (deploy && missing.length) {
    throw new Error(`${target} is not deploy-ready: missing bindings ${missing.join(', ')}. Do not borrow resources from another environment.`);
  }
  if (deploy && target === 'local') {
    throw new Error('Local resources are emulator-only. Local deploys are disabled.');
  }

  if (target === 'staging') {
    assert.equal(env.workers_dev, false, 'staging must not be exposed on workers.dev');
    assert.ok(d1.every((item) => item.database_name.includes('-staging')), 'staging D1 names must be environment-specific');
    assert.ok(buckets.every((item) => item.bucket_name.endsWith('-staging')), 'staging R2 buckets must be environment-specific');
    assert.ok(services.some((item) => item.binding === 'WORKER_SELF_REFERENCE' && item.service === expected.worker), 'staging must self-reference its own Worker');
    assert.ok(env.routes?.some((route) => route.pattern === 'staging.siamrooftech.com/*'), 'staging must route only through its protected hostname');
    if (deploy && !accessReady) throw new Error('Refusing staging deployment: verify the staging hostname is protected by Cloudflare Access first.');
  }
  if (target === 'production') {
    assert.ok(env.routes?.some((route) => route.pattern === 'www.siamrooftech.com/*'), 'production must route only the declared canonical hostname');
    assert.ok(env.durable_objects?.bindings?.some((binding) => binding.name === 'NEXT_CACHE_DO_QUEUE' && binding.class_name === 'DOQueueHandler'), 'production must use the verified OpenNext Durable Object binding');
    assert.ok(services.some((item) => item.binding === 'WORKER_SELF_REFERENCE' && item.service === expected.worker), 'production must self-reference the production Worker');
  }
  for (const binding of d1) {
    const expectedPrefix = binding.binding === 'NEXT_TAG_CACHE_D1' ? `siamrooftech-cache-${target}` : `siamrooftech-cms-${target}`;
    assert.equal(binding.database_name, expectedPrefix, `${target} ${binding.binding} database name must match its isolated target`);
  }
  for (const bucket of buckets) {
    const expectedBucket = bucket.binding === 'MEDIA_BUCKET' ? `siamrooftech-media${target === 'local' ? '' : `-${target}`}` : `siamrooftech-opennext-cache${target === 'local' ? '' : `-${target}`}`;
    assert.equal(bucket.bucket_name, expectedBucket, `${target} ${bucket.binding} bucket name must match its isolated target`);
  }
  if (target === 'local') {
    assert.ok(d1.every((item) => item.database_name.includes('-local')), 'local D1 names must be local-only');
    assert.ok(services.some((item) => item.binding === 'WORKER_SELF_REFERENCE' && item.service === expected.worker), 'local must self-reference the local Worker');
  }

  for (const otherTarget of ['local', 'staging', 'production']) {
    if (otherTarget === target) continue;
    const other = otherTarget === 'local' ? config : config.env?.[otherTarget];
    if (!other) continue;
    const sharedD1 = d1.flatMap((item) => item.database_id ? [item.database_id] : [])
      .filter((id) => (other.d1_databases || []).some((candidate) => candidate.database_id === id));
    if (sharedD1.length) throw new Error(`${target} and ${otherTarget} share D1 resource IDs; isolation failed.`);
    const sharedBuckets = buckets.map((item) => item.bucket_name)
      .filter((name) => (other.r2_buckets || []).some((candidate) => candidate.bucket_name === name));
    if (sharedBuckets.length) throw new Error(`${target} and ${otherTarget} share R2 buckets; isolation failed.`);
  }

  const blockingReasons = [...missing];
  if (target === 'local') blockingReasons.push('local deploy disabled');
  if (target === 'staging' && !accessReady) blockingReasons.push('Cloudflare Access not verified');
  return {
    target,
    worker: env.name,
    origin: expected.origin,
    missingBindings: missing,
    deployReady: blockingReasons.length === 0,
    blockingReasons,
  };
}

export function readConfig(path = 'wrangler.jsonc') {
  return JSON.parse(readFileSync(path, 'utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const config = readConfig();
  const targetArg = args.find((arg) => arg.startsWith('--target='));
  if (targetArg) {
    const target = targetArg.slice('--target='.length);
    const status = assessConfig(config, target, {
      deploy: args.includes('--deploy'),
      accessReady: process.env.STAGING_ACCESS_READY === 'true',
      productionReady: process.env.PRODUCTION_CUTOVER_READY === 'true',
    });
    console.log(`${target}: ${status.deployReady ? 'READY' : `NOT READY (${status.blockingReasons.join(', ')})`}`);
  } else {
    for (const target of ['local', 'staging', 'production']) {
      const status = assessConfig(config, target);
      console.log(`${target}: ${status.deployReady ? 'ready' : `defined; deployment preflight will block (${status.blockingReasons.join(', ')})`}`);
    }
  }
}
