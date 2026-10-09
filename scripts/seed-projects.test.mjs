import assert from 'node:assert/strict';
import test from 'node:test';
import { fileProjects } from '../src/data/projects.ts';
import { assertSeedTarget, buildProjectSeedSql, buildProjectStatements, parseSeedArgs, parseWranglerJson } from './seed-projects.mjs';

test('seed command defaults to a read-only local dry run', () => {
  assert.deepEqual(parseSeedArgs([]), { target: 'local', apply: false });
});

test('staging writes require an explicit staging target and apply flag', () => {
  assert.deepEqual(parseSeedArgs(['--target', 'staging', '--apply']), {
    target: 'staging',
    apply: true,
  });
  assert.deepEqual(parseSeedArgs(['--target=staging']), {
    target: 'staging',
    apply: false,
  });
});

test('seed command rejects production and unknown mutation targets', () => {
  assert.throws(() => parseSeedArgs(['--target', 'production', '--apply']), /local or staging/);
  assert.throws(() => parseSeedArgs(['--force']), /Unknown or incomplete option/);
});

test('staging target is locked to the configured staging Worker and CMS D1', () => {
  const stagingConfig = {
    env: {
      staging: {
        name: 'siamrooftech-staging',
        d1_databases: [{
          binding: 'APP_DB',
          database_name: 'siamrooftech-cms-staging',
          database_id: '9a9be19b-990c-4e3b-bdae-fa5d9ba73716',
        }],
      },
    },
  };
  assert.equal(assertSeedTarget('staging', stagingConfig).database_name, 'siamrooftech-cms-staging');
  assert.throws(() => assertSeedTarget('staging', { env: { staging: { name: 'siamrooftech' } } }), /must name/);
  assert.throws(() => assertSeedTarget('staging', {
    env: {
      staging: {
        ...stagingConfig.env.staging,
        d1_databases: [{
          binding: 'APP_DB',
          database_name: 'siamrooftech-cms-production',
          database_id: 'production-database-id',
        }],
      },
    },
  }), /staging CMS database/);
});

test('remote SQL safely quotes values and Wrangler JSON output is parsed', () => {
  const [project] = buildProjectStatements([{
    id: "project-o'hara",
    slug: 'test-project-1',
    title: "Owner's project",
    images: [],
  }], '2026-10-06T00:00:00.000Z');
  const sql = buildProjectSeedSql([project]);
  assert.match(sql, /project-o''hara/);
  assert.match(sql, /Owner''s project/);
  assert.equal(parseWranglerJson('[{"results":[{"id":"p1"}],"success":true}]')[0].id, 'p1');
  assert.throws(() => parseWranglerJson('not json'), /did not return JSON/);
  assert.throws(() => parseWranglerJson('[{"results":[],"success":false}]'), /failed D1 query/);
});

test('project seed data has unique routes and matches the known local baseline', () => {
  const statements = buildProjectStatements(fileProjects, '2026-10-06T00:00:00.000Z');
  assert.equal(statements.length, 16);
  assert.equal(statements.reduce((sum, row) => sum + JSON.parse(row.payload).images.length, 0), 67);
  assert.equal(statements[0].path, '/projects/retractable-awning-5x2-2');
  assert.equal(new Set(statements.map((row) => row.id)).size, 16);
  assert.equal(new Set(statements.map((row) => row.path)).size, 16);
});
