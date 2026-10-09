#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { getPlatformProxy } from 'wrangler';

const STAGING_WORKER_NAME = 'siamrooftech-staging';
const STAGING_DATABASE_NAME = 'siamrooftech-cms-staging';
const STAGING_DATABASE_ID = '9a9be19b-990c-4e3b-bdae-fa5d9ba73716';

export function parseSeedArgs(argv) {
  let apply = false;
  let target = 'local';
  while (argv.length) {
    const flag = argv.shift();
    if (flag === '--apply') apply = true;
    else if (flag === '--target') {
      if (!argv[0] || argv[0].startsWith('--')) throw new Error('Provide local or staging after --target.');
      target = argv.shift();
    } else if (flag.startsWith('--target=')) target = flag.slice('--target='.length);
    else throw new Error('Unknown or incomplete option. Use --target local|staging and optional --apply.');
  }
  if (!['local', 'staging'].includes(target)) throw new Error('Seed target must be local or staging.');
  return { target, apply };
}

export function assertSeedTarget(target, config) {
  if (target === 'local') return null;
  const staging = config.env?.staging;
  if (staging?.name !== STAGING_WORKER_NAME) {
    throw new Error(`Refusing staging seed: Wrangler env.staging must name ${STAGING_WORKER_NAME}.`);
  }
  const database = staging.d1_databases?.find((binding) => binding.binding === 'APP_DB');
  if (database?.database_name !== STAGING_DATABASE_NAME || database?.database_id !== STAGING_DATABASE_ID) {
    throw new Error(`Refusing staging seed: APP_DB must point to the approved staging CMS database ${STAGING_DATABASE_NAME}.`);
  }
  return database;
}

export function buildProjectStatements(projects, importedAt = new Date().toISOString()) {
  const errors = [];
  const seenIds = new Set();
  const seenPaths = new Set();
  const statements = [];
  for (const project of projects) {
    const path = `/projects/${project.slug}`;
    if (!project.id || !project.slug || !project.title || !Array.isArray(project.images)) errors.push(`Incomplete project record: ${project.id || '(missing id)'}`);
    if (seenIds.has(project.id)) errors.push(`Duplicate project id: ${project.id}`);
    if (seenPaths.has(path)) errors.push(`Duplicate project path: ${path}`);
    seenIds.add(project.id);
    seenPaths.add(path);
    const payload = JSON.stringify(project);
    const hash = createHash('sha256').update(payload).digest('hex');
    const ordinal = Number(project.slug.match(/-(\d+)$/)?.[1] || 0);
    const base = project.slug.replace(/-\d+$/, '');
    statements.push({
      id: project.id,
      path,
      base,
      ordinal,
      title: project.title,
      payload,
      hash,
      createdAt: project.created_at || null,
      modifiedAt: project.updated_at || project.created_at || null,
      importedAt,
    });
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return statements;
}

export function parseWranglerJson(output) {
  const jsonStart = output.search(/[\[{]/);
  if (jsonStart < 0) throw new Error('Wrangler did not return JSON output.');
  let parsed;
  try {
    parsed = JSON.parse(output.slice(jsonStart));
  } catch {
    throw new Error('Wrangler returned invalid JSON output.');
  }
  const responses = Array.isArray(parsed) ? parsed : [parsed];
  if (responses.some((response) => response.success === false || !Array.isArray(response.results))) {
    throw new Error('Wrangler reported a failed D1 query.');
  }
  return responses.flatMap((response) => response.results);
}

function sqlString(value) {
  return value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
}

export function buildProjectSeedSql(projects) {
  return projects.flatMap((project) => [
    `INSERT INTO content_entries (id, kind, renderer, revision, source_created_at, imported_at) VALUES (${sqlString(project.id)}, 'project', 'project', 0, ${sqlString(project.createdAt)}, ${sqlString(project.importedAt)});`,
    `INSERT INTO content_drafts (entry_id, schema_version, title, proposed_path, payload_json, content_hash, saved_at) VALUES (${sqlString(project.id)}, 1, ${sqlString(project.title)}, ${sqlString(project.path)}, ${sqlString(project.payload)}, ${sqlString(project.hash)}, ${sqlString(project.importedAt)});`,
    `INSERT INTO content_routes (path, entry_id, retired_at) VALUES (${sqlString(project.path)}, ${sqlString(project.id)}, NULL);`,
    `INSERT INTO content_publications (entry_id, path, revision, schema_version, title, payload_json, content_hash, first_published_at, content_modified_at) VALUES (${sqlString(project.id)}, ${sqlString(project.path)}, 0, 1, ${sqlString(project.title)}, ${sqlString(project.payload)}, ${sqlString(project.hash)}, ${sqlString(project.createdAt)}, ${sqlString(project.modifiedAt)});`,
    `INSERT INTO project_slug_sequences (base, high_water_mark) VALUES (${sqlString(project.base)}, ${project.ordinal}) ON CONFLICT(base) DO UPDATE SET high_water_mark = MAX(high_water_mark, excluded.high_water_mark);`,
  ]).join('\n');
}

function runRemoteD1(config, sql, file = false) {
  const args = [
    'd1', 'execute', 'APP_DB', '--remote', '--env', 'staging',
    file ? '--file' : '--command', sql, '--json', '--config', 'wrangler.jsonc',
  ];
  const output = execFileSync('node_modules/.bin/wrangler', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: config.account_id },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return parseWranglerJson(output);
}

async function seedStaging(source) {
  const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
  assertSeedTarget('staging', config);
  const ids = source.map((project) => sqlString(project.id)).join(', ');
  const existingRows = runRemoteD1(config, `
    SELECT e.id, r.path, d.content_hash AS draft_hash, p.content_hash AS published_hash
    FROM content_entries e
    LEFT JOIN content_routes r ON r.entry_id = e.id
    LEFT JOIN content_drafts d ON d.entry_id = e.id
    LEFT JOIN content_publications p ON p.entry_id = e.id
    WHERE e.id IN (${ids}) AND e.kind = 'project'
  `);
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const pending = [];
  for (const project of source) {
    const existing = existingById.get(project.id);
    if (!existing) {
      pending.push(project);
      continue;
    }
    if (existing.path !== project.path) throw new Error(`Existing project ${project.id} has a conflicting path; importer will not overwrite it.`);
    if (existing.draft_hash !== project.hash || existing.published_hash !== project.hash) {
      throw new Error(`Existing project ${project.id} differs from the seed baseline; importer will not overwrite it.`);
    }
  }

  if (pending.length) {
    const tempDir = mkdtempSync(join(tmpdir(), 'siamrooftech-project-seed-'));
    const sqlPath = join(tempDir, 'seed.sql');
    try {
      writeFileSync(sqlPath, buildProjectSeedSql(pending), { mode: 0o600 });
      runRemoteD1(config, sqlPath, true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  const publishedRows = runRemoteD1(config, "SELECT id, path, content_hash, payload_json FROM published_content WHERE kind = 'project'");
  const publishedById = new Map(publishedRows.map((row) => [row.id, row]));
  const imageCount = source.reduce((sum, row) => sum + JSON.parse(row.payload).images.length, 0);
  for (const project of source) {
    const published = publishedById.get(project.id);
    if (!published || published.path !== project.path || published.content_hash !== project.hash) {
      throw new Error(`Imported project ${project.id} failed published-content verification.`);
    }
    if (!Array.isArray(JSON.parse(published.payload_json).images) || JSON.parse(published.payload_json).images.length !== JSON.parse(project.payload).images.length) {
      throw new Error(`Imported project ${project.id} has a media record count mismatch.`);
    }
  }
  return { publishedCount: publishedById.size, importedCount: pending.length, imageCount };
}

async function main() {
  const { target, apply } = parseSeedArgs(process.argv.slice(2));
  const { fileProjects } = await import('../src/data/projects.ts');
  const source = buildProjectStatements(fileProjects);
  const imageCount = source.reduce((sum, item) => sum + JSON.parse(item.payload).images.length, 0);
  console.log(`Target: ${target}. Source contains ${source.length} projects and ${imageCount} image records.`);
  if (!apply) {
    console.log(`Dry run only. No database was opened or changed. Add --apply to import into ${target}.`);
    return;
  }

  if (target === 'staging') {
    const result = await seedStaging(source);
    console.log(`staging seed verified. Published projects: ${result.publishedCount}; baseline projects: ${source.length}; baseline image records: ${result.imageCount}; imported this run: ${result.importedCount}.`);
    return;
  }

  const proxy = await getPlatformProxy({
    configPath: 'wrangler.jsonc',
    persist: target === 'local',
    remoteBindings: target === 'staging',
  });
  try {
    const db = proxy.env.APP_DB;
    if (!db) throw new Error(`${target} APP_DB binding is missing. Apply its reviewed database migrations first.`);
    const statements = [];
    for (const project of source) {
      const existing = await db.prepare(`
        SELECT r.path, d.content_hash AS draft_hash, p.content_hash AS published_hash
        FROM content_entries e
        LEFT JOIN content_routes r ON r.entry_id = e.id
        LEFT JOIN content_drafts d ON d.entry_id = e.id
        LEFT JOIN content_publications p ON p.entry_id = e.id
        WHERE e.id = ? AND e.kind = 'project'
      `).bind(project.id).first();
      if (existing) {
        if (existing.path !== project.path) throw new Error(`Existing project ${project.id} has a conflicting path; importer will not overwrite it.`);
        if (existing.draft_hash !== project.hash || existing.published_hash !== project.hash) {
          throw new Error(`Existing project ${project.id} differs from the seed baseline; importer will not overwrite it.`);
        }
        continue;
      }
      statements.push(
        db.prepare("INSERT INTO content_entries (id, kind, renderer, revision, source_created_at, imported_at) VALUES (?, 'project', 'project', 0, ?, ?)").bind(project.id, project.createdAt, project.importedAt),
        db.prepare('INSERT INTO content_drafts (entry_id, schema_version, title, proposed_path, payload_json, content_hash, saved_at) VALUES (?, 1, ?, ?, ?, ?, ?)').bind(project.id, project.title, project.path, project.payload, project.hash, project.importedAt),
        db.prepare('INSERT INTO content_routes (path, entry_id, retired_at) VALUES (?, ?, NULL)').bind(project.path, project.id),
        db.prepare('INSERT INTO content_publications (entry_id, path, revision, schema_version, title, payload_json, content_hash, first_published_at, content_modified_at) VALUES (?, ?, 0, 1, ?, ?, ?, ?, ?)').bind(project.id, project.path, project.title, project.payload, project.hash, project.createdAt, project.modifiedAt),
        db.prepare('INSERT INTO project_slug_sequences (base, high_water_mark) VALUES (?, ?) ON CONFLICT(base) DO UPDATE SET high_water_mark = MAX(high_water_mark, excluded.high_water_mark)').bind(project.base, project.ordinal),
      );
    }
    if (statements.length) await db.batch(statements);
    const { results } = await db.prepare("SELECT id, path, content_hash, payload_json FROM published_content WHERE kind = 'project'").all();
    const publishedById = new Map(results.map((row) => [row.id, row]));
    for (const project of source) {
      const published = publishedById.get(project.id);
      if (!published || published.path !== project.path || published.content_hash !== project.hash) {
        throw new Error(`Imported project ${project.id} failed published-content verification.`);
      }
      const publishedPayload = JSON.parse(published.payload_json);
      if (!Array.isArray(publishedPayload.images) || publishedPayload.images.length !== JSON.parse(project.payload).images.length) {
        throw new Error(`Imported project ${project.id} has a media record count mismatch.`);
      }
    }
    console.log(`${target} seed verified. Published projects: ${publishedById.size}; baseline projects: ${source.length}; baseline image records: ${imageCount}; imported this run: ${statements.length / 5}.`);
  } finally {
    await proxy.dispose();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Project import failed.');
    process.exitCode = 1;
  });
}
