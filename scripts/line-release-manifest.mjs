#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readConfig } from './deployment-policy.mjs';
import { lineTarget } from './line-worker-policy.mjs';
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
export function lineManifest(target, directory, sha) {
  assert.match(sha, /^[a-f0-9]{40}$/i, 'exact release SHA required');
  const config = readConfig('workers/line-chat-history/wrangler.jsonc');
  const { env } = lineTarget(config, target);
  assert.ok(['staging', 'production'].includes(target));
  return { sha, target, worker: env.name, bundle: hash(join(directory, 'index.js')),
    config: hash('workers/line-chat-history/wrangler.jsonc'), lockfile: hash('yarn.lock'),
    migrations: Object.fromEntries(readdirSync('workers/line-chat-history/migrations').filter((file) => file.endsWith('.sql')).sort()
      .map((file) => [file, hash(`workers/line-chat-history/migrations/${file}`)])) };
}
if (process.argv[1]?.endsWith('/line-release-manifest.mjs')) {
  const [operation, target, directory] = process.argv.slice(2);
  const expected = lineManifest(target, directory, process.env.GITHUB_SHA ?? '');
  const path = join(directory, 'manifest.json');
  if (operation === 'create') writeFileSync(path, `${JSON.stringify(expected, null, 2)}\n`);
  else { assert.equal(operation, 'verify'); assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), expected); }
  console.log(`LINE ${target} manifest ${operation} passed.`);
}
