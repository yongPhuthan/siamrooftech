import { NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';
import { createProjectDraft, listAdminProjects } from '@/features/projects/server/repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  try {
    return NextResponse.json(await listAdminProjects(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Admin project list failed', error);
    return NextResponse.json({ error: 'Projects are unavailable' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();
  const body = await request.json().catch(() => null);
  try {
    const project = await createProjectDraft(body);
    return NextResponse.json(project, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'INVALID_PROJECT' ? 400 : code === 'PROJECT_ALREADY_EXISTS' ? 409 : 503;
    return NextResponse.json({ error: status === 400 ? 'Invalid project' : status === 409 ? 'Project already exists' : 'Could not save project draft' }, { status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
