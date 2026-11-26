import { NextResponse } from 'next/server';
import { unauthorizedResponse } from '@/lib/api-auth';
import { verifyProjectEditorRequest } from '@/lib/projects-agent-auth';
import { getAdminProjectBySlug, publishProject } from '@/features/projects/server/repository';
import { revalidatePublicContent } from '@/lib/public-content-revalidation';
import { projectsReadOnly, projectsReadOnlyResponse } from '@/features/projects/server/source';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (projectsReadOnly()) return projectsReadOnlyResponse();
  if (!(await verifyProjectEditorRequest(request))) return unauthorizedResponse();
  const { slug } = await params;
  const body = await request.json().catch(() => null) as { expectedRevision?: unknown } | null;
  if (!body || typeof body.expectedRevision !== 'number') return NextResponse.json({ error: 'Expected revision is required' }, { status: 400 });
  const project = await getAdminProjectBySlug(slug);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  try {
    const published = await publishProject(project.id, body.expectedRevision);
    revalidatePublicContent('project', [`/projects/${slug}`]);
    return NextResponse.json(published, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'REVISION_CONFLICT' || code === 'SLUG_CONFLICT' ? 409 : code === 'PROJECT_NOT_FOUND' ? 404 : code === 'PROJECT_PUBLICATION_INVALID' || code === 'INVALID_PROJECT_PATH' ? 400 : 503;
    return NextResponse.json({ error: status === 409 ? 'Project changed or its URL is already in use' : status === 404 ? 'Project not found' : status === 400 ? 'Project is missing publication requirements' : 'Could not publish project' }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
