import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';

/**
 * Admin proxy for the leads dashboard. Forwards to the line-chat-history
 * Worker's /leads*, /leads/unmatched, and /ads-sync/jobs endpoints.
 *
 * Unlike the existing admin API routes (articles/projects), GET is also
 * gated behind verifyAdminRequest here — lead data includes gclid and
 * attribution details that shouldn't be publicly readable the way draft
 * articles currently are (see docs/lead-matching/README.md).
 */

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

async function proxy(request: NextRequest, context: RouteContext, method: 'GET' | 'POST') {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  const workerUrl = process.env.LINE_CHAT_HISTORY_WORKER_URL;
  const token = method === 'GET' ? process.env.CHAT_HISTORY_READ_TOKEN : process.env.CHAT_HISTORY_WRITE_TOKEN;
  if (!workerUrl || !token) {
    console.error('LINE_CHAT_HISTORY_WORKER_URL or chat-history token not configured');
    return NextResponse.json({ error: 'leads API not configured' }, { status: 500 });
  }

  const { path } = await context.params;
  const targetPath = `/${path.join('/')}`;
  const search = request.nextUrl.search;

  try {
    const res = await fetch(`${workerUrl.replace(/\/$/, '')}${targetPath}${search}`, {
      method,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: method === 'POST' ? await request.text() : undefined,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('leads admin proxy failed', error);
    return NextResponse.json({ error: 'leads API unreachable' }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'POST');
}
