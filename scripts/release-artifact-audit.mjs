#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = '.open-next';
assert.ok((await stat(root)).isDirectory(), 'OpenNext artifact must exist');
const forbidden = [
  'Local CMS QA article',
  'Published content for local CMS verification.',
  'Temporary local test content.',
  'cms-qa-',
];
const failures = [];
async function visit(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) await visit(file);
    else {
      const body = await readFile(file);
      if (body.includes(0)) continue;
      const text = body.toString('utf8');
      for (const marker of forbidden) if (text.includes(marker)) failures.push(`${file}: contains a local QA fixture marker`);
    }
  }
}
await visit(root);
assert.deepEqual(failures, [], failures.join('\n'));
console.log('OpenNext artifact audit passed: no known local CMS fixture content was embedded.');
