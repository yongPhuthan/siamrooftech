import 'server-only';
import { NextResponse } from 'next/server';
import { ProjectPayloadSchema } from '../project-schema';
import type { Project } from '../types';

/**
 * Projects live only on production. Local and staging set PROJECTS_SOURCE_URL to production and read its published
 * projects from the public feed instead of keeping their own; they cannot create or edit projects.
 */
export const PROJECTS_FEED_PATH = '/api/projects/published';

export function projectsSourceUrl(): string | null {
  const url = process.env.PROJECTS_SOURCE_URL?.trim();
  return url ? url.replace(/\/+$/, '') : null;
}

export function projectsReadOnly(): boolean {
  return projectsSourceUrl() !== null;
}

export function projectsReadOnlyResponse() {
  return NextResponse.json({ error: 'Projects are edited on production only' }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
}

/** What the public may see of a project: everything except the internal site notes. */
export function publicProject(project: Project): Project {
  const { proof: _proof, ...rest } = project;
  return rest as Project;
}

/** Reads the source's published projects, keeping only entries that still match the schema. */
export async function fetchSourceProjects(source: string, fetcher: typeof fetch = fetch): Promise<Project[]> {
  const response = await fetcher(`${source}${PROJECTS_FEED_PATH}`, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Project source answered ${response.status}`);
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error('Project source returned an unexpected body');
  return body.flatMap((item) => {
    const parsed = ProjectPayloadSchema.safeParse(item);
    return parsed.success ? [parsed.data as Project] : [];
  });
}
