import assert from 'node:assert/strict';
import test from 'node:test';
import { assessConfig, readConfig } from './deployment-policy.mjs';

const config = readConfig();

test('local uses only local resources and cannot be deployed', () => {
  assert.equal(assessConfig(config, 'local').origin, 'http://localhost:3000');
  assert.throws(() => assessConfig(config, 'local', { deploy: true }), /Local deploys are disabled/);
});

test('staging is isolated, private from workers.dev, and noindex', () => {
  const result = assessConfig(config, 'staging');
  assert.equal(result.origin, 'https://staging.siamrooftech.com');
  assert.throws(() => assessConfig(config, 'staging', { deploy: true }), /Cloudflare Access/);
  assert.equal(assessConfig(config, 'staging', { deploy: true, accessReady: true }).deployReady, true);
  const broken = structuredClone(config);
  broken.env.staging.r2_buckets[0].bucket_name = 'siamrooftech-media';
  assert.throws(() => assessConfig(broken, 'staging'), /environment-specific/);
  const indexable = structuredClone(config);
  indexable.env.staging.vars.INDEX_POLICY = 'index';
  assert.throws(() => assessConfig(indexable, 'staging'), /INDEX_POLICY mismatch/);
});

test('production stays blocked until isolated resources exist and cutover readiness is verified', () => {
  assert.equal(assessConfig(config, 'production').deployReady, false);
  assert.match(assessConfig(config, 'production').blockingReasons.join(' '), /readiness not verified/);
  assert.equal(assessConfig(config, 'production', { productionReady: true }).deployReady, true);
  assert.equal(assessConfig(config, 'production', { deploy: true, productionReady: true }).deployReady, true);
  assert.throws(() => assessConfig(config, 'production', { deploy: true }), /cutover is not authorized/);
  const swapped = structuredClone(config);
  swapped.env.production.d1_databases = structuredClone(config.env.staging.d1_databases);
  assert.throws(() => assessConfig(swapped, 'production', { deploy: true, productionReady: true }), /database name must match its isolated target/);
});

test('unknown target fails closed', () => {
  assert.throws(() => assessConfig(config, 'prodution'), /Unknown deployment target/);
});
