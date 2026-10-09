#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createManifest } from './release-manifest.mjs';

const [target, path = 'release-manifest.json'] = process.argv.slice(2);
const saved = JSON.parse(await readFile(path, 'utf8'));
const sha = process.env.GITHUB_SHA || process.env.RELEASE_SHA;
assert.equal(saved.target, target, 'artifact target must match reviewed deployment environment');
assert.equal(saved.commitSha, sha, 'artifact SHA must match the workflow SHA');
const current = await createManifest({ target, sha });
for (const key of ['target', 'origin', 'artifactDigest', 'lockfileDigest', 'deploymentConfigDigest', 'migrations']) {
  assert.deepEqual(saved[key], current[key], `artifact manifest ${key} mismatch`);
}
console.log(`Release artifact verified for ${target} at ${sha}.`);
