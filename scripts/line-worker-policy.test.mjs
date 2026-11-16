import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from './deployment-policy.mjs';
import { lineTarget, verifyLineIsolation } from './line-worker-policy.mjs';
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
const config = () => readConfig('workers/line-chat-history/wrangler.jsonc');
test('LINE targets are isolated and never enable live conversion sync', () => {
  verifyLineIsolation(config());
  assert.throws(() => lineTarget(config(), 'production', 'siamrooftech-line-chat-staging'));
  const mixed = config(); mixed.env.local.d1_databases[0].remote = true;
  assert.throws(() => verifyLineIsolation(mixed));
});
test('production LINE release requires same-run staging validation and a prebuilt verified artifact', () => {
  const release = parse(readFileSync('.github/workflows/line-worker-release.yml', 'utf8'));
  assert.deepEqual(release.jobs['deploy-production'].needs, ['validate', 'deploy-staging']);
  assert.equal(release.jobs['deploy-production'].environment, 'Production');
  const steps = JSON.stringify(release.jobs['deploy-production'].steps);
  assert.match(steps, /line-release-manifest.mjs verify production/);
  assert.match(steps, /line-staging-verified/);
  assert.match(steps, /--no-bundle/);
  assert.doesNotMatch(steps, /migrations apply/);
  assert.match(JSON.stringify(release.jobs['migrate-production']), /confirm_database_name/);
  assert.ok(release.jobs['migrate-production'].needs.includes('migrate-staging'));
  assert.equal(release.jobs['migrate-staging'].environment, 'staging');
});
