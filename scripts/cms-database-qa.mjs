import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { getPlatformProxy } from 'wrangler';

const proxy = await getPlatformProxy({ configPath: 'wrangler.jsonc', persist: true, remoteBindings: false });
const db = proxy.env.APP_DB;
if (!db) throw new Error('Local APP_DB binding is missing.');

const suffix = randomUUID();
const entryId = `qa-${suffix}`;
const path = `/qa/${suffix}`;
const now = new Date().toISOString();
const payload = JSON.stringify({ type: 'doc', content: [] });

try {
  const baseline = await db.prepare("SELECT COUNT(*) AS count FROM published_content WHERE kind='project'").first();
  assert.equal(baseline?.count, 16, 'local D1 has the 16 imported published projects');

  await db.batch([
    db.prepare("INSERT INTO content_entries (id,kind,renderer,revision,source_created_at,imported_at) VALUES (?,'article','document',0,?,?)").bind(entryId, now, now),
    db.prepare('INSERT INTO content_drafts (entry_id,schema_version,title,proposed_path,payload_json,content_hash,saved_at) VALUES (?,1,?,?,?,?,?)').bind(entryId, 'QA draft', path, payload, 'draft-hash', now),
  ]);
  assert.equal(await db.prepare('SELECT id FROM published_content WHERE id=?').bind(entryId).first(), null, 'draft remains private');

  await db.batch([
    db.prepare('INSERT INTO content_routes (path,entry_id,retired_at) VALUES (?,?,NULL)').bind(path, entryId),
    db.prepare("INSERT INTO content_publications (entry_id,path,revision,schema_version,title,payload_json,content_hash,first_published_at,content_modified_at) VALUES (?,?,1,1,'QA published',?,'live-hash',?,?)").bind(entryId, path, payload, now, now),
  ]);
  assert.equal((await db.prepare('SELECT id FROM published_content WHERE id=?').bind(entryId).first())?.id, entryId, 'published snapshot is visible');

  await db.prepare("UPDATE content_drafts SET title='Draft changed',payload_json=? WHERE entry_id=?").bind(JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'private edit' }] }] }), entryId).run();
  const stillLive = await db.prepare('SELECT title,payload_json FROM published_content WHERE id=?').bind(entryId).first();
  assert.equal(stillLive?.title, 'QA published', 'draft save does not change the live title');
  assert.equal(stillLive?.payload_json, payload, 'draft save does not change the live payload');

  await db.batch([
    db.prepare('DELETE FROM content_publications WHERE entry_id=?').bind(entryId),
    db.prepare('UPDATE content_routes SET retired_at=? WHERE entry_id=?').bind(now, entryId),
  ]);
  assert.equal(await db.prepare('SELECT id FROM published_content WHERE id=?').bind(entryId).first(), null, 'unpublished snapshot is hidden');
  assert.ok(await db.prepare('SELECT path FROM content_routes WHERE entry_id=? AND retired_at IS NOT NULL').bind(entryId).first(), 'unpublish retains the route reservation');

  const duplicate = await db.prepare('SELECT path FROM content_routes WHERE entry_id=? LIMIT 1').bind((await db.prepare("SELECT entry_id FROM content_routes WHERE path LIKE '/projects/%' LIMIT 1").first())?.entry_id).first();
  assert.ok(duplicate?.path, 'baseline route exists for uniqueness test');
  const failedId = `qa-rollback-${suffix}`;
  await assert.rejects(db.batch([
    db.prepare("INSERT INTO content_entries (id,kind,renderer,revision,imported_at) VALUES (?,'article','document',0,?)").bind(failedId, now),
    db.prepare('INSERT INTO content_routes (path,entry_id,retired_at) VALUES (?,?,NULL)').bind(duplicate.path, failedId),
  ]), /UNIQUE|constraint/i);
  assert.equal(await db.prepare('SELECT id FROM content_entries WHERE id=?').bind(failedId).first(), null, 'failed batch rolls back earlier statements');

  console.log('Local CMS QA passed: imported baseline, private drafts, publish visibility, draft isolation, route retention, and batch rollback.');
} finally {
  await db.batch([
    db.prepare('DELETE FROM content_publications WHERE entry_id=?').bind(entryId),
    db.prepare('DELETE FROM content_routes WHERE entry_id=?').bind(entryId),
    db.prepare('DELETE FROM content_drafts WHERE entry_id=?').bind(entryId),
    db.prepare('DELETE FROM content_entries WHERE id=?').bind(entryId),
  ]);
  await proxy.dispose();
}
