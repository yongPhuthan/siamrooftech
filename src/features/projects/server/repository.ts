import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';
import { NewProjectPayloadSchema, ProjectPayloadSchema } from '../project-schema';
import type { Project } from '../types';

function parseProject(payload: string, entryId: string, path: string): Project | null {
  let raw: unknown;
  try { raw = JSON.parse(payload); } catch { return null; }
  const parsed = ProjectPayloadSchema.safeParse(raw);
  if (!parsed.success || parsed.data.id !== entryId || path !== `/projects/${parsed.data.slug}`) return null;
  return parsed.data as Project;
}

function contentHash(project: Project) {
  return createHash('sha256').update(JSON.stringify(project)).digest('hex');
}

export async function listPublishedProjects(): Promise<Project[]> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const { results } = await APP_DB.prepare("SELECT id, path, payload_json FROM published_content WHERE kind = 'project' ORDER BY content_modified_at DESC, id").all<{ id: string; path: string; payload_json: string }>();
  return results.flatMap((row) => {
    const project = parseProject(row.payload_json, row.id, row.path);
    return project ? [project] : [];
  });
}

export async function getPublishedProjectBySlug(slug: string): Promise<Project | null> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const row = await APP_DB.prepare("SELECT id, path, payload_json FROM published_content WHERE kind = 'project' AND path = ? LIMIT 1").bind(`/projects/${slug}`).first<{ id: string; path: string; payload_json: string }>();
  return row ? parseProject(row.payload_json, row.id, row.path) : null;
}

export async function getPublishedProjectById(id: string): Promise<Project | null> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const row = await APP_DB.prepare("SELECT id, path, payload_json FROM published_content WHERE kind = 'project' AND id = ? LIMIT 1").bind(id).first<{ id: string; path: string; payload_json: string }>();
  return row ? parseProject(row.payload_json, row.id, row.path) : null;
}

export async function listAdminProjects() {
  const { APP_DB } = await getCmsRuntimeEnv();
  const { results } = await APP_DB.prepare("SELECT e.id, e.revision, d.payload_json AS draft_json, d.proposed_path, p.payload_json AS published_json, p.path AS published_path FROM content_entries e JOIN content_drafts d ON d.entry_id=e.id LEFT JOIN content_publications p ON p.entry_id=e.id WHERE e.kind='project' AND e.deleted_at IS NULL ORDER BY d.saved_at DESC, e.id").all<{ id: string; revision: number; draft_json: string; proposed_path: string | null; published_json: string | null; published_path: string | null }>();
  return results.flatMap((row) => {
    const project = parseProject(row.draft_json, row.id, row.proposed_path || `/projects/${JSON.parse(row.draft_json).slug}`);
    if (!project) return [];
    return [{ ...project, revision: row.revision, isPublished: Boolean(row.published_json) }];
  });
}

export async function createProjectDraft(input: unknown): Promise<Project> {
  const parsed = NewProjectPayloadSchema.safeParse(input);
  if (!parsed.success) throw new Error('INVALID_PROJECT');
  const { APP_DB } = await getCmsRuntimeEnv();
  const now = new Date().toISOString();
  const prefix = parsed.data.type === 'มอเตอร์ไฟฟ้า' ? 'electric-awning' : 'retractable-awning';
  const size = `${parsed.data.width}x${parsed.data.extension}`.replaceAll('.', '-');
  const base = `${prefix}-${size}`;
  const sequence = await APP_DB.prepare('INSERT INTO project_slug_sequences (base, high_water_mark) VALUES (?, 1) ON CONFLICT(base) DO UPDATE SET high_water_mark=high_water_mark+1 RETURNING high_water_mark').bind(base).first<{ high_water_mark: number }>();
  if (!sequence) throw new Error('SLUG_ALLOCATION_FAILED');
  const project = { ...parsed.data, id: randomUUID(), slug: `${base}-${sequence.high_water_mark}`, created_at: now, updated_at: now } as Project;
  const path = `/projects/${project.slug}`;
  const payload = JSON.stringify(project);
  const hash = contentHash(project);
  const statements = [
    APP_DB.prepare("INSERT INTO content_entries (id, kind, renderer, revision, source_created_at, imported_at) VALUES (?, 'project', 'project', 0, ?, ?)").bind(project.id, project.created_at || null, now),
    APP_DB.prepare('INSERT INTO content_drafts (entry_id, schema_version, title, proposed_path, payload_json, content_hash, saved_at) VALUES (?, 1, ?, ?, ?, ?, ?)').bind(project.id, project.title, path, payload, hash, now),
  ];
  try { await APP_DB.batch(statements); } catch (error) { if (String(error).includes('UNIQUE')) throw new Error('PROJECT_ALREADY_EXISTS'); throw error; }
  return { ...project, revision: 0, isPublished: false };
}

export async function saveProjectDraft(id: string, expectedRevision: number, input: unknown): Promise<Project> {
  const parsed = ProjectPayloadSchema.safeParse(input);
  if (!parsed.success || parsed.data.id !== id) throw new Error('INVALID_PROJECT');
  const { APP_DB } = await getCmsRuntimeEnv();
  const current = await APP_DB.prepare("SELECT e.revision, d.proposed_path, p.path AS published_path FROM content_entries e JOIN content_drafts d ON d.entry_id=e.id LEFT JOIN content_publications p ON p.entry_id=e.id WHERE e.id=? AND e.kind='project' AND e.deleted_at IS NULL").bind(id).first<{ revision: number; proposed_path: string | null; published_path: string | null }>();
  if (!current) throw new Error('PROJECT_NOT_FOUND');
  if (current.revision !== expectedRevision) throw new Error('REVISION_CONFLICT');
  const now = new Date().toISOString();
  const path = current.published_path || current.proposed_path || `/projects/${parsed.data.slug}`;
  const project = { ...parsed.data, slug: path.slice('/projects/'.length), updated_at: now } as Project;
  const payload = JSON.stringify(project);
  const hash = contentHash(project);
  const results = await APP_DB.batch([
    APP_DB.prepare('UPDATE content_entries SET revision=revision+1 WHERE id=? AND revision=? AND deleted_at IS NULL').bind(id, expectedRevision),
    APP_DB.prepare('UPDATE content_drafts SET title=?, proposed_path=?, payload_json=?, content_hash=?, saved_at=? WHERE entry_id=? AND (SELECT changes())=1').bind(project.title, path, payload, hash, now, id),
  ]);
  if (results[0]?.meta.changes !== 1) throw new Error('REVISION_CONFLICT');
  return { ...project, revision: expectedRevision + 1, isPublished: Boolean(current.published_path) };
}

export async function publishProject(id: string, expectedRevision: number) {
  const { APP_DB } = await getCmsRuntimeEnv();
  const current = await APP_DB.prepare("SELECT e.revision, d.payload_json, d.proposed_path FROM content_entries e JOIN content_drafts d ON d.entry_id=e.id WHERE e.id=? AND e.kind='project' AND e.deleted_at IS NULL").bind(id).first<{ revision: number; payload_json: string; proposed_path: string | null }>();
  if (!current) throw new Error('PROJECT_NOT_FOUND');
  if (current.revision !== expectedRevision) throw new Error('REVISION_CONFLICT');
  let raw: unknown;
  try { raw = JSON.parse(current.payload_json); } catch { throw new Error('INVALID_PROJECT'); }
  const parsed = ProjectPayloadSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.images.some((image) => image.type === 'after' || !image.type)) throw new Error('PROJECT_PUBLICATION_INVALID');
  const project = parsed.data as Project;
  const path = current.proposed_path || `/projects/${project.slug}`;
  if (path !== `/projects/${project.slug}`) throw new Error('INVALID_PROJECT_PATH');
  const hash = contentHash(project);
  const publishedAt = project.created_at || new Date().toISOString();
  const modifiedAt = project.updated_at || publishedAt;
  const routeOwner = await APP_DB.prepare('SELECT entry_id FROM content_routes WHERE path=?').bind(path).first<{ entry_id: string }>();
  if (routeOwner && routeOwner.entry_id !== id) throw new Error('SLUG_CONFLICT');
  let results: D1Result[];
  try {
    results = await APP_DB.batch([
      APP_DB.prepare('UPDATE content_entries SET revision=revision+1 WHERE id=? AND revision=? AND deleted_at IS NULL').bind(id, expectedRevision),
      APP_DB.prepare('INSERT INTO content_routes (path, entry_id, retired_at) SELECT proposed_path, entry_id, NULL FROM content_drafts WHERE entry_id=? AND (SELECT changes())=1 AND (SELECT revision FROM content_entries WHERE id=?)=? ON CONFLICT(path) DO UPDATE SET retired_at=NULL WHERE entry_id=excluded.entry_id').bind(id, id, expectedRevision + 1),
      APP_DB.prepare("INSERT INTO content_publications (entry_id,path,revision,schema_version,title,payload_json,content_hash,first_published_at,content_modified_at) SELECT d.entry_id,d.proposed_path,e.revision,d.schema_version,d.title,d.payload_json,d.content_hash,?,? FROM content_drafts d JOIN content_entries e ON e.id=d.entry_id WHERE d.entry_id=? AND e.revision=? AND (SELECT changes())=1 ON CONFLICT(entry_id) DO UPDATE SET path=excluded.path,revision=excluded.revision,schema_version=excluded.schema_version,title=excluded.title,payload_json=excluded.payload_json,content_hash=excluded.content_hash,first_published_at=COALESCE(content_publications.first_published_at,excluded.first_published_at),content_modified_at=CASE WHEN content_publications.content_hash=excluded.content_hash THEN content_publications.content_modified_at ELSE excluded.content_modified_at END").bind(publishedAt, modifiedAt, id, expectedRevision + 1),
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
  return { ...project, revision: expectedRevision + 1, isPublished: true };
}

export async function unpublishProject(id: string, expectedRevision: number) {
  const { APP_DB } = await getCmsRuntimeEnv();
  const now = new Date().toISOString();
  const results = await APP_DB.batch([
    APP_DB.prepare('UPDATE content_entries SET revision=revision+1 WHERE id=? AND revision=? AND deleted_at IS NULL').bind(id, expectedRevision),
    APP_DB.prepare('DELETE FROM content_publications WHERE entry_id=? AND (SELECT changes())=1').bind(id),
    APP_DB.prepare('UPDATE content_routes SET retired_at=? WHERE entry_id=? AND (SELECT changes())=1').bind(now, id),
  ]);
  if (results[0]?.meta.changes !== 1) throw new Error('REVISION_CONFLICT');
  return { revision: expectedRevision + 1, isPublished: false };
}

export async function deleteProject(id: string, expectedRevision: number): Promise<void> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const now = new Date().toISOString();
  const results = await APP_DB.batch([
    APP_DB.prepare('UPDATE content_entries SET revision=revision+1, deleted_at=? WHERE id=? AND revision=? AND deleted_at IS NULL').bind(now, id, expectedRevision),
    APP_DB.prepare('UPDATE content_routes SET retired_at=? WHERE entry_id=? AND EXISTS (SELECT 1 FROM content_entries WHERE id=? AND revision=? AND deleted_at=?)').bind(now, id, id, expectedRevision + 1, now),
    APP_DB.prepare('DELETE FROM content_publications WHERE entry_id=? AND EXISTS (SELECT 1 FROM content_entries WHERE id=? AND revision=? AND deleted_at=?)').bind(id, id, expectedRevision + 1, now),
  ]);
  if (results[0]?.meta.changes !== 1) throw new Error('REVISION_CONFLICT');
}

export async function incrementProjectViewCount(slug: string): Promise<boolean> {
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return false;
  const { APP_DB } = await getCmsRuntimeEnv();
  const next = { ...project, viewCount: (project.viewCount || 0) + 1, lastViewedAt: new Date().toISOString() };
  const result = await APP_DB.prepare('UPDATE content_publications SET payload_json=?, content_hash=? WHERE entry_id=? AND path=?').bind(JSON.stringify(next), contentHash(next), project.id, `/projects/${slug}`).run();
  return result.meta.changes === 1;
}

export async function getRelatedProjects(ids: string[]) {
  if (!ids.length) return [];
  const wanted = new Set(ids);
  return (await listPublishedProjects()).filter((project) => wanted.has(project.id));
}

export async function deleteProjectBySlug(slug: string, expectedRevision?: number): Promise<void> {
  const { APP_DB } = await getCmsRuntimeEnv();
  const entry = await APP_DB.prepare("SELECT e.id, e.revision FROM content_entries e JOIN content_drafts d ON d.entry_id=e.id WHERE e.kind='project' AND d.proposed_path=? AND e.deleted_at IS NULL").bind(`/projects/${slug}`).first<{ id: string; revision: number }>();
  if (!entry) throw new Error('PROJECT_NOT_FOUND');
  if (expectedRevision !== undefined && entry.revision !== expectedRevision) throw new Error('REVISION_CONFLICT');
  await deleteProject(entry.id, entry.revision);
}

export async function getAdminProjectBySlug(slug: string) {
  return (await listAdminProjects()).find((project) => project.slug === slug) || null;
}

export const projectsRepository = {
  getAll: listPublishedProjects,
  getById: getPublishedProjectById,
  getBySlug: getPublishedProjectBySlug,
  getByCategory: async (category: string) => (await listPublishedProjects()).filter((project) => project.category === category),
  getRelatedProjects,
  listAdmin: listAdminProjects,
  getAdminBySlug: getAdminProjectBySlug,
  deleteBySlug: deleteProjectBySlug,
};
