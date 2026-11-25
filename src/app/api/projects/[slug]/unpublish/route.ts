import { NextResponse } from 'next/server';
import { unauthorizedResponse } from '@/lib/api-auth';
import { verifyProjectEditorRequest } from '@/lib/projects-agent-auth';
import { getAdminProjectBySlug, unpublishProject } from '@/features/projects/server/repository';
import { revalidatePublicContent } from '@/lib/public-content-revalidation';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await verifyProjectEditorRequest(request))) return unauthorizedResponse();
  const { slug } = await params;
  const body = await request.json().catch(() => null) as { expectedRevision?: unknown } | null;
  if (!body || typeof body.expectedRevision !== 'number') return NextResponse.json({ error: 'Expected revision is required' }, { status: 400 });
  const project = await getAdminProjectBySlug(slug);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  try {
    const result = await unpublishProject(project.id, body.expectedRevision);
    revalidatePublicContent('project', [`/projects/${slug}`]);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'REVISION_CONFLICT' ? 409 : 503;
    return NextResponse.json({ error: status === 409 ? 'Project changed in another session' : 'Could not unpublish project' }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
