import { NextResponse } from 'next/server';
import { listDatabaseProjects } from '@/features/projects/server/repository';
import { publicProject } from '@/features/projects/server/source';

export const dynamic = 'force-dynamic';

/** Published projects from this site's own D1. Local and staging read production's copy of this feed. */
export async function GET() {
  try {
    const projects = (await listDatabaseProjects()).map(publicProject);
    return NextResponse.json(projects, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  } catch (error) {
    console.error('Published project feed failed', error);
    return NextResponse.json({ error: 'Projects are unavailable' }, { status: 503 });
  }
}
