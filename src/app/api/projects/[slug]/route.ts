import { NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { getPublishedProjectBySlug, getAdminProjectBySlug, saveProjectDraft, deleteProjectBySlug } from '@/features/projects/server/repository';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const project = await getPublishedProjectBySlug(slug);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json(project, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  } catch (error) {
    console.error('Project API read failed', error);
    return NextResponse.json({ error: 'Project data is unavailable' }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const { slug } = await params;
  const current = await getAdminProjectBySlug(slug);
  if (!current) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  const body = await request.json().catch(() => null) as { expectedRevision?: unknown; project?: unknown } | null;
  if (!body || typeof body.expectedRevision !== 'number' || !body.project) return NextResponse.json({ error: 'Invalid project update' }, { status: 400 });
  try {
    const project = await saveProjectDraft(current.id, body.expectedRevision, body.project);
    return NextResponse.json(project, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'REVISION_CONFLICT' ? 409 : code === 'PROJECT_NOT_FOUND' ? 404 : code === 'INVALID_PROJECT' ? 400 : 503;
    return NextResponse.json({ error: status === 409 ? 'Project changed in another session' : status === 404 ? 'Project not found' : status === 400 ? 'Invalid project' : 'Could not save project draft' }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const { slug } = await params;
  const body = await request.json().catch(() => null) as { expectedRevision?: unknown } | null;
  if (!body || typeof body.expectedRevision !== 'number') return NextResponse.json({ error: 'Expected revision is required' }, { status: 400 });
  try {
    await deleteProjectBySlug(slug, body.expectedRevision);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'REVISION_CONFLICT' ? 409 : code === 'PROJECT_NOT_FOUND' ? 404 : 503;
    return NextResponse.json({ error: status === 404 ? 'Project not found' : status === 409 ? 'Project changed in another session' : 'Could not delete project' }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
