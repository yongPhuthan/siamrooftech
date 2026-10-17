import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedResponse, verifyAdminRequest } from '@/lib/api-auth';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

async function proxy(request: NextRequest, context: RouteContext, method: 'GET' | 'POST') {
  if (!(await verifyAdminRequest(request))) return unauthorizedResponse();

  const workerUrl = process.env.LINE_CHAT_HISTORY_WORKER_URL;
  const token = method === 'GET' ? process.env.CHAT_HISTORY_READ_TOKEN : process.env.CHAT_HISTORY_WRITE_TOKEN;
  if (!workerUrl || !token) {
    return NextResponse.json({ error: 'chat API not configured' }, { status: 500 });
  }

  const { path } = await context.params;
  const target = `${workerUrl.replace(/\/$/, '')}/${path.join('/')}${request.nextUrl.search}`;
  const headers = new Headers({ authorization: `Bearer ${token}` });
  const contentType = request.headers.get('content-type');
  const idempotencyKey = request.headers.get('idempotency-key');
  if (contentType) headers.set('content-type', contentType);
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);

  try {
    const response = await fetch(target, {
      method,
      headers,
      body: method === 'POST' ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
    });
    const outgoingHeaders = new Headers();
    for (const name of ['content-type', 'content-length', 'cache-control', 'x-content-type-options']) {
      const value = response.headers.get(name);
      if (value) outgoingHeaders.set(name, value);
    }
    return new NextResponse(response.body, { status: response.status, headers: outgoingHeaders });
  } catch (error) {
    console.error('chat admin proxy failed', error);
    return NextResponse.json({ error: 'chat API unreachable' }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'POST');
}
