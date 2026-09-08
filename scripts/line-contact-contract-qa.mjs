#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const projectRoot = process.cwd();
const sourceRoot = resolve(projectRoot, 'src');
const canonicalModule = 'src/features/line-contact/constants.ts';
const verifiedLineUrl = 'https://lin.ee/pPz1ZqN';
const failures = [];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  }));
  return files.flat();
}

let canonicalSource = '';
try {
  canonicalSource = await readFile(resolve(projectRoot, canonicalModule), 'utf8');
} catch {
  failures.push(`${canonicalModule}: canonical LINE contact module is missing`);
}

if (!canonicalSource.includes(`export const LINE_CONTACT_URL = '${verifiedLineUrl}' as const;`)) {
  failures.push(`${canonicalModule}: must export the independently verified URL ${verifiedLineUrl}`);
}

for (const path of await sourceFiles(sourceRoot)) {
  const source = await readFile(path, 'utf8');
  const file = relative(projectRoot, path);

  if (/https?:\/\/(?:www\.)?line\.me\/en(?:\/|\b)/i.test(source)) {
    failures.push(`${file}: generic line.me/en fallback is forbidden`);
  }
  if (/https?:\/\/(?:www\.)?line\.me\/R\/oaMessage(?:\/|\b)/i.test(source)) {
    failures.push(`${file}: constructed LINE OA message deep links are forbidden`);
  }
  if (file !== canonicalModule && source.includes('https://lin.ee/')) {
    failures.push(`${file}: import LINE_CONTACT_URL instead of duplicating a LINE short-link literal`);
  }
}

if (failures.length) {
  console.error('LINE contact contract QA failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`LINE contact contract QA passed: ${verifiedLineUrl}`);
