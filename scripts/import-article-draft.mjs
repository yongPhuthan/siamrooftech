#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getPlatformProxy } from 'wrangler';
import { convertCmsDraftToSiamrooftech } from '../src/features/articles/draft-import';
import { isValidArticleSlug } from '../src/features/articles/article-path';

export function parseImportArgs(argv) {
  let inputPath = '';
  let category;
  let mediaMapPath;
  let apply = false;

  while (argv.length) {
    const token = argv.shift();
    if (token === '--apply') apply = true;
    else if (token === '--category') category = argv.shift();
    else if (token?.startsWith('--category=')) category = token.slice('--category='.length);
    else if (token === '--media-map') mediaMapPath = argv.shift();
    else if (token?.startsWith('--media-map=')) mediaMapPath = token.slice('--media-map='.length);
    else if (token?.startsWith('-')) throw new Error(`Unknown option: ${token}`);
    else if (!inputPath) inputPath = token;
    else throw new Error(`Unexpected extra argument: ${token}`);
  }

  if (!inputPath) {
    throw new Error('Usage: node --import tsx scripts/import-article-draft.mjs <cms-draft.json|handoff-dir> [--category "คำแนะนำ"] [--media-map media-map.json] [--apply]');
  }
  return { inputPath: resolve(inputPath), category, mediaMapPath: mediaMapPath ? resolve(mediaMapPath) : undefined, apply };
}

function loadInputPayload(inputPath) {
  const stats = statSync(inputPath);
  if (!stats.isDirectory()) return JSON.parse(readFileSync(inputPath, 'utf8'));

  const cmsDraftFile = join(inputPath, 'cms-draft.json');
  if (existsSync(cmsDraftFile)) return JSON.parse(readFileSync(cmsDraftFile, 'utf8'));

  const articleFile = join(inputPath, 'article.json');
  if (!existsSync(articleFile)) {
    throw new Error(`No cms-draft.json or article.json found in directory: ${inputPath}`);
  }
  const article = JSON.parse(readFileSync(articleFile, 'utf8'));
  const mediaFile = join(inputPath, 'media.json');
  if (existsSync(mediaFile)) {
    article.media = JSON.parse(readFileSync(mediaFile, 'utf8'));
  }
  return article;
}

function hashContent(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function main() {
  const { inputPath, category, mediaMapPath, apply } = parseImportArgs(process.argv.slice(2));
  const rawInput = loadInputPayload(inputPath);
  const mediaOverrides = mediaMapPath ? JSON.parse(readFileSync(mediaMapPath, 'utf8')) : undefined;

  const { converted, problems } = convertCmsDraftToSiamrooftech(rawInput, { category, mediaOverrides });
  if (problems.length || !converted) {
    console.error('Draft validation failed:');
    for (const problem of problems) console.error(`- ${problem.field}: ${problem.message}`);
    process.exitCode = 1;
    return;
  }

  const { metadata, document, seoSettings, markerCount, warnings } = converted;
  if (!isValidArticleSlug(metadata.slug)) {
    throw new Error(`Invalid or missing slug "${metadata.slug}". Set a lowercase English slug before importing.`);
  }

  const proposedPath = `/articles/${metadata.slug}`;
  const headingCount = document.content.filter((node) => node.type === 'heading').length;
  console.log(`Ready to import local CMS draft:`);
  console.log(`- Title: ${metadata.title}`);
  console.log(`- Path: ${proposedPath}`);
  console.log(`- Headings: ${headingCount}`);
  console.log(`- Fill markers ([[...]]): ${markerCount}`);
  for (const warning of warnings) console.log(`- Warning: ${warning}`);

  if (!apply) {
    console.log('Dry run only. No database was opened or changed. Add --apply to insert into local D1.');
    return;
  }

  const proxy = await getPlatformProxy({
    configPath: 'wrangler.jsonc',
    persist: true,
    remoteBindings: false,
  });

  try {
    const db = proxy.env.APP_DB;
    if (!db) throw new Error('Local APP_DB binding is missing. Run yarn db:migrate:local first.');

    const existingRoute = await db.prepare('SELECT entry_id FROM content_routes WHERE path = ?').bind(proposedPath).first();
    if (existingRoute) {
      throw new Error(`Refusing import: published route ${proposedPath} is already owned by entry ${existingRoute.entry_id}.`);
    }
    const existingDraft = await db.prepare('SELECT entry_id FROM content_drafts WHERE proposed_path = ?').bind(proposedPath).first();
    if (existingDraft) {
      throw new Error(`Refusing import: draft ${proposedPath} already exists (entry ${existingDraft.entry_id}). Edit it in /admin/articles instead.`);
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const draftPayload = { metadata, document, seoSettings, updatedAt: now };
    await db.batch([
      db.prepare("INSERT INTO content_entries (id, kind, renderer, revision, imported_at) VALUES (?, 'article', 'document', 0, ?)").bind(id, now),
      db.prepare('INSERT INTO content_drafts (entry_id, schema_version, title, proposed_path, payload_json, content_hash, saved_at) VALUES (?, 1, ?, ?, ?, ?, ?)').bind(
        id,
        metadata.title,
        proposedPath,
        JSON.stringify(draftPayload),
        hashContent({ metadata, document }),
        now,
      ),
    ]);

    console.log(`Imported local CMS draft successfully:`);
    console.log(`- Entry ID: ${id}`);
    console.log(`- Admin editor: /admin/articles/${id}`);
  } finally {
    await proxy.dispose();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Article draft import failed.');
    process.exitCode = 1;
  });
}
