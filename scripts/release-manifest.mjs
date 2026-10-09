#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readConfig, assessConfig } from './deployment-policy.mjs';

async function hashPath(path) {
  const digest = createHash('sha256');
  async function visit(current) {
    const info = await stat(current);
    if (info.isDirectory()) {
      const entries = (await readdir(current)).sort();
      for (const entry of entries) await visit(resolve(current, entry));
    } else {
      digest.update(relative(path, current).split(sep).join('/'));
      digest.update(await readFile(current));
    }
  }
  await visit(path);
  return digest.digest('hex');
}

export async function createManifest({ target, sha, artifactPath = '.open-next' }) {
  const config = readConfig();
  const policy = assessConfig(config, target);
  const migrations = {};
  for (const folder of ['drizzle/migrations', 'drizzle/cache-migrations']) {
    const files = (await readdir(folder)).filter((name) => name.endsWith('.sql')).sort();
    migrations[folder] = Object.fromEntries(await Promise.all(files.map(async (name) => [name, createHash('sha256').update(await readFile(resolve(folder, name))).digest('hex')])));
  }
  return {
    schemaVersion: 1,
    commitSha: sha,
    target,
    origin: policy.origin,
    artifactDigest: await hashPath(artifactPath),
    lockfileDigest: createHash('sha256').update(await readFile('yarn.lock')).digest('hex'),
    deploymentConfigDigest: createHash('sha256').update(JSON.stringify({
      main: config.main,
      compatibility_date: config.compatibility_date,
      compatibility_flags: config.compatibility_flags,
      migrations: config.migrations,
      environment: config.env?.[target] || config,
    })).digest('hex'),
    migrations,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const target = process.argv[2];
  const output = process.argv[3];
  const sha = process.env.GITHUB_SHA || process.env.RELEASE_SHA;
  if (!sha || !/^[a-f0-9]{40}$/i.test(sha)) throw new Error('GITHUB_SHA must be a full commit SHA.');
  const manifest = await createManifest({ target, sha });
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  if (output) await writeFile(output, serialized, { mode: 0o600 });
  else process.stdout.write(serialized);
}
