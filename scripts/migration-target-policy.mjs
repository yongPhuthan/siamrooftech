#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readConfig } from './deployment-policy.mjs';

export function getMigrationTarget(config, target, confirmedName) {
  if (!['staging', 'production'].includes(target)) throw new Error('Database migrations are allowed only for staging or production.');
  const worker = config.env?.[target];
  if (!worker) throw new Error(`Wrangler environment ${target} is missing.`);
  const binding = worker.d1_databases?.find((item) => item.binding === 'APP_DB');
  if (!binding?.database_id || !binding.database_name) throw new Error(`${target} APP_DB is not configured; refusing to run a migration.`);
  if (binding.database_name !== confirmedName) throw new Error(`Target confirmation mismatch: expected exact database name ${binding.database_name}.`);
  const expectedPrefix = target === 'staging' ? 'siamrooftech-cms-staging' : 'siamrooftech-cms-production';
  assert.equal(binding.database_name, expectedPrefix, `${target} migrations must target its isolated CMS database`);
  const cache = worker.d1_databases.find((item) => item.binding === 'NEXT_TAG_CACHE_D1');
  if (!cache?.database_id || !cache.database_name.includes(target)) throw new Error(`${target} cache database binding is missing or not environment-specific.`);
  return { target, databaseName: binding.database_name, cacheDatabaseName: cache.database_name };
}

if (process.argv[1]?.endsWith('migration-target-policy.mjs')) {
  const [target, confirmedName] = process.argv.slice(2);
  const result = getMigrationTarget(readConfig(), target, confirmedName);
  console.log(`Migration target verified: ${result.target} / ${result.databaseName} (cache: ${result.cacheDatabaseName}).`);
}
