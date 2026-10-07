import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';
import type { AdminArticleSummary } from '../admin-types';
import { ArticleDocumentSchema, ArticleMetadataSchema, resolveArticleSeoSettings } from '../document-schema';
import type { ArticleSeoSettings } from '../document-schema';
import { ArticleRecordV1, ArticleSnapshot, buildPublishedSnapshot, validateForPublication } from '../publication-policy';

export interface AdminArticleRecord extends ArticleRecordV1 {
  status: 'draft' | 'published' | 'published-with-draft-changes';
}

function recordStatus(record: ArticleRecordV1): AdminArticleRecord['status'] {
  if (!record.published) return 'draft';
  return JSON.stringify({ metadata: record.draft.metadata, document: record.draft.document }) === JSON.stringify({ metadata: record.published.metadata, document: record.published.document })
    ? 'published'
    : 'published-with-draft-changes';
}

function parsedSnapshot(value: unknown, id: string): ArticleSnapshot | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as Record<string, unknown>;
  const metadata = ArticleMetadataSchema.safeParse(input.metadata);
  const document = ArticleDocumentSchema.safeParse(input.document);
  if (input.schemaVersion !== 1 || input.articleId !== id || !metadata.success || !document.success || typeof input.revision !== 'number' || typeof input.publishedAt !== 'string' || typeof input.modifiedAt !== 'string') return undefined;
  if (validateForPublication(metadata.data, document.data).length) return undefined;
  return { schemaVersion: 1, articleId: id, revision: input.revision, metadata: metadata.data, document: document.data, publishedAt: input.publishedAt, modifiedAt: input.modifiedAt };
}

function parseStoredRecord(row: { id: string; revision: number; draft_json: string; published_json: string | null }): ArticleRecordV1 | null {
  let draftRaw: unknown;
  let publishedRaw: unknown;
  try {
    draftRaw = JSON.parse(row.draft_json);
    publishedRaw = row.published_json ? JSON.parse(row.published_json) : undefined;
  } catch { return null; }
  if (!draftRaw || typeof draftRaw !== 'object') return null;
  const draftInput = draftRaw as Record<string, unknown>;
  const metadata = ArticleMetadataSchema.safeParse(draftInput.metadata);
  const document = ArticleDocumentSchema.safeParse(draftInput.document);
  let seoSettings: ArticleSeoSettings;
  try { seoSettings = resolveArticleSeoSettings(draftInput.seoSettings); } catch { return null; }
  if (!metadata.success || !document.success || typeof draftInput.updatedAt !== 'string') return null;
  const published = parsedSnapshot(publishedRaw, row.id);
  return {
    schemaVersion: 1,
    id: row.id,
    revision: row.revision,
    draft: { metadata: metadata.data, document: document.data, seoSettings, updatedAt: draftInput.updatedAt },
    ...(published ? { published } : {}),
  };
}

function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function getStoredRecord(id: string): Promise<ArticleRecordV1 | null> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const row = await APP_DB.prepare("SELECT e.id,e.revision,d.payload_json AS draft_json,p.payload_json AS published_json FROM content_entries e JOIN content_drafts d ON d.entry_id=e.id LEFT JOIN content_publications p ON p.entry_id=e.id WHERE e.id=? AND e.kind='article' AND e.deleted_at IS NULL").bind(id).first<{ id: string; revision: number; draft_json: string; published_json: string | null }>();
  return row ? parseStoredRecord(row) : null;
}

export async function listAdminArticleSummaries(): Promise<AdminArticleSummary[]> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const { results } = await APP_DB.prepare("SELECT e.id,e.revision,d.payload_json AS draft_json,p.payload_json AS published_json,d.saved_at FROM content_entries e JOIN content_drafts d ON d.entry_id=e.id LEFT JOIN content_publications p ON p.entry_id=e.id WHERE e.kind='article' AND e.deleted_at IS NULL ORDER BY d.saved_at DESC,e.id").all<{ id: string; revision: number; draft_json: string; published_json: string | null; saved_at: string | null }>();
  return results.flatMap((row) => {
    const record = parseStoredRecord(row);
    if (!record) return [];
    const status = recordStatus(record);
    return [{
      id: record.id,
      legacy: false,
      title: record.draft.metadata.title || 'บทความไม่มีชื่อ',
      slug: record.published?.metadata.slug || record.draft.metadata.slug,
      revision: record.revision,
      hasPublishedSnapshot: Boolean(record.published),
      updatedAt: record.draft.updatedAt,
      status,
    }];
  });
}

export async function getAdminArticle(id: string): Promise<AdminArticleRecord | null> {
  const record = await getStoredRecord(id);
  return record ? { ...record, status: recordStatus(record) } : null;
}

export async function createArticleDraft(metadataInput: unknown, documentInput: unknown, seoSettingsInput?: unknown): Promise<AdminArticleRecord> {
  const metadata = ArticleMetadataSchema.parse(metadataInput);
  const document = ArticleDocumentSchema.parse(documentInput);
  const seoSettings = resolveArticleSeoSettings(seoSettingsInput);
  const { APP_DB } = await getCmsRuntimeEnv();
  const id = randomUUID();
  const now = new Date().toISOString();
  const draft = { metadata, document, seoSettings, updatedAt: now };
  const payload = JSON.stringify(draft);
  await APP_DB.batch([
    APP_DB.prepare("INSERT INTO content_entries (id,kind,renderer,revision,imported_at) VALUES (?,'article','document',0,?)").bind(id, now),
    APP_DB.prepare('INSERT INTO content_drafts (entry_id,schema_version,title,proposed_path,payload_json,content_hash,saved_at) VALUES (?,1,?,?,?,?,?)').bind(id, metadata.title, `/articles/${metadata.slug}`, payload, hash({ metadata, document }), now),
  ]);
  return { schemaVersion: 1, id, revision: 0, draft, status: 'draft' };
}

export async function saveArticleDraft(id: string, expectedRevision: number, metadataInput: unknown, documentInput: unknown, seoSettingsInput?: unknown): Promise<AdminArticleRecord> {
  const current = await getStoredRecord(id);
  if (!current) throw new Error('ARTICLE_NOT_FOUND');
  if (current.revision !== expectedRevision) throw new Error('REVISION_CONFLICT');
  const metadata = ArticleMetadataSchema.parse(metadataInput);
  const document = ArticleDocumentSchema.parse(documentInput);
  const seoSettings = resolveArticleSeoSettings(seoSettingsInput, current.draft.seoSettings);
  const { APP_DB } = await getCmsRuntimeEnv();
  const now = new Date().toISOString();
  const draft = { metadata, document, seoSettings, updatedAt: now };
  const path = `/articles/${metadata.slug}`;
  const results = await APP_DB.batch([
    APP_DB.prepare("UPDATE content_entries SET revision=revision+1 WHERE id=? AND kind='article' AND revision=? AND deleted_at IS NULL").bind(id, expectedRevision),
    APP_DB.prepare('UPDATE content_drafts SET title=?,proposed_path=?,payload_json=?,content_hash=?,saved_at=? WHERE entry_id=? AND (SELECT changes())=1').bind(metadata.title, path, JSON.stringify(draft), hash({ metadata, document }), now, id),
  ]);
  if (results[0]?.meta.changes !== 1) throw new Error('REVISION_CONFLICT');
  const updated: ArticleRecordV1 = { schemaVersion: 1, id, revision: expectedRevision + 1, draft, ...(current.published ? { published: current.published } : {}) };
  return { ...updated, status: recordStatus(updated) };
}

export async function publishArticle(id: string, expectedRevision: number): Promise<AdminArticleRecord> {
  const current = await getStoredRecord(id);
  if (!current) throw new Error('ARTICLE_NOT_FOUND');
  if (current.revision !== expectedRevision) throw new Error('REVISION_CONFLICT');
  const problems = validateForPublication(current.draft.metadata, current.draft.document);
  if (problems.length) {
    const error = new Error('PUBLICATION_INVALID');
    Object.assign(error, { problems });
    throw error;
  }
  const { APP_DB } = await getCmsRuntimeEnv();
  const now = new Date().toISOString();
  const nextRevision = expectedRevision + 1;
  const published = buildPublishedSnapshot(id, nextRevision, current.draft.metadata, current.draft.document, now, current.published);
  const path = `/articles/${published.metadata.slug}`;
  const publishedJson = JSON.stringify(published);
  const contentHash = hash({ metadata: published.metadata, document: published.document });
  const routeOwner = await APP_DB.prepare('SELECT entry_id FROM content_routes WHERE path=?').bind(path).first<{ entry_id: string }>();
  if (routeOwner && routeOwner.entry_id !== id) throw new Error('SLUG_CONFLICT');
  let results: D1Result[];
  try {
    results = await APP_DB.batch([
      APP_DB.prepare("UPDATE content_entries SET revision=revision+1 WHERE id=? AND kind='article' AND revision=? AND deleted_at IS NULL").bind(id, expectedRevision),
      APP_DB.prepare('INSERT INTO content_routes (path,entry_id,retired_at) SELECT proposed_path,entry_id,NULL FROM content_drafts WHERE entry_id=? AND (SELECT changes())=1 AND (SELECT revision FROM content_entries WHERE id=?)=? ON CONFLICT(path) DO UPDATE SET retired_at=NULL WHERE entry_id=excluded.entry_id').bind(id, id, nextRevision),
      APP_DB.prepare("INSERT INTO content_publications (entry_id,path,revision,schema_version,title,payload_json,content_hash,first_published_at,content_modified_at) SELECT ?,?, ?,1,?,?,?, ?,? WHERE (SELECT changes())=1 ON CONFLICT(entry_id) DO UPDATE SET path=excluded.path,revision=excluded.revision,schema_version=excluded.schema_version,title=excluded.title,payload_json=excluded.payload_json,content_hash=excluded.content_hash,first_published_at=COALESCE(content_publications.first_published_at,excluded.first_published_at),content_modified_at=CASE WHEN content_publications.content_hash=excluded.content_hash THEN content_publications.content_modified_at ELSE excluded.content_modified_at END").bind(id, path, nextRevision, published.metadata.title, publishedJson, contentHash, published.publishedAt, published.modifiedAt),
      APP_DB.prepare('UPDATE content_entries SET revision=-1 WHERE id=? AND (SELECT changes())=0').bind(id),
    ]);
  } catch (error) {
    if (/UNIQUE|constraint|CHECK/i.test(String(error))) {
      const currentOwner = await APP_DB.prepare('SELECT entry_id FROM content_routes WHERE path=?').bind(path).first<{ entry_id: string }>();
      if (currentOwner && currentOwner.entry_id !== id) throw new Error('SLUG_CONFLICT');
      throw new Error('REVISION_CONFLICT');
    }
    throw error;
  }
  if (results[0]?.meta.changes !== 1 || results[1]?.meta.changes !== 1 || results[2]?.meta.changes !== 1) throw new Error('REVISION_CONFLICT');
  const updated: ArticleRecordV1 = { ...current, revision: nextRevision, published };
  return { ...updated, status: recordStatus(updated) };
}

export async function unpublishArticle(id: string, expectedRevision: number): Promise<ArticleRecordV1> {
  const current = await getStoredRecord(id);
  if (!current) throw new Error('ARTICLE_NOT_FOUND');
  if (current.revision !== expectedRevision) throw new Error('REVISION_CONFLICT');
  const { APP_DB } = await getCmsRuntimeEnv();
  const now = new Date().toISOString();
  const results = await APP_DB.batch([
    APP_DB.prepare("UPDATE content_entries SET revision=revision+1 WHERE id=? AND kind='article' AND revision=? AND deleted_at IS NULL").bind(id, expectedRevision),
    APP_DB.prepare('DELETE FROM content_publications WHERE entry_id=? AND (SELECT changes())=1').bind(id),
    APP_DB.prepare('UPDATE content_routes SET retired_at=? WHERE entry_id=? AND (SELECT changes())=1').bind(now, id),
  ]);
  if (results[0]?.meta.changes !== 1) throw new Error('REVISION_CONFLICT');
  return { schemaVersion: 1, id, revision: expectedRevision + 1, draft: current.draft };
}

export async function getPublishedArticleBySlug(slug: string): Promise<ArticleSnapshot | null> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const row = await APP_DB.prepare("SELECT id,path,payload_json FROM published_content WHERE kind='article' AND path=? LIMIT 1").bind(`/articles/${slug}`).first<{ id: string; path: string; payload_json: string }>();
  if (!row) return null;
  try { return parsedSnapshot(JSON.parse(row.payload_json), row.id) ?? null; } catch { return null; }
}

export async function getPublishedArticles(): Promise<ArticleSnapshot[]> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const { results } = await APP_DB.prepare("SELECT id,payload_json FROM published_content WHERE kind='article' ORDER BY first_published_at DESC,id").all<{ id: string; payload_json: string }>();
  return results.flatMap((row) => {
    try {
      const snapshot = parsedSnapshot(JSON.parse(row.payload_json), row.id);
      return snapshot ? [snapshot] : [];
    } catch { return []; }
  });
}
