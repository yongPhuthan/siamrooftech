import assert from 'node:assert/strict';
import test from 'node:test';
import { getMigrationTarget } from './migration-target-policy.mjs';
import { readConfig } from './deployment-policy.mjs';

const config = readConfig();
test('staging requires exact DB confirmation and isolated CMS/cache bindings', () => {
  assert.equal(getMigrationTarget(config, 'staging', 'siamrooftech-cms-staging').target, 'staging');
  assert.throws(() => getMigrationTarget(config, 'staging', 'siamrooftech-cms-production'), /confirmation mismatch/);
});
test('production migration stays blocked until production databases are explicitly configured', () => {
  assert.throws(() => getMigrationTarget(config, 'production', 'siamrooftech-cms-production'), /APP_DB is not configured/);
});
test('local and unknown targets cannot run through the remote migration workflow', () => {
  assert.throws(() => getMigrationTarget(config, 'local', 'siamrooftech-cms-local'), /only for staging or production/);
});
