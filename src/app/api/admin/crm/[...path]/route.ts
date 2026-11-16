import { readJsonBody } from '@/features/lead-crm/json-body';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/api-auth';

interface Context { params: Promise<{ path: string[] }> }
async function proxy(request: NextRequest, context: Context) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return unauthorizedResponse();
  const { path } = await context.params;
  if (path.some((segment) => !segment || segment === '.' || segment === '..' || /[/\\?#]/.test(segment))) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  }
  const workerUrl = process.env.LINE_CHAT_HISTORY_WORKER_URL;
  const token = request.method === 'GET' ? process.env.CHAT_HISTORY_READ_TOKEN : process.env.CHAT_HISTORY_WRITE_TOKEN;
  if (!workerUrl || !token) return NextResponse.json({ error: 'CRM not configured' }, { status: 503 });
  const headers = new Headers({ authorization: `Bearer ${token}`, 'x-crm-actor': `admin:${admin.id}` });
  if (request.method === 'POST') headers.set('content-type', 'application/json');
  try {
    const response = await fetch(`${workerUrl.replace(/\/$/, '')}/crm/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`, {
      method: request.method, headers, body: request.method === 'POST' ? JSON.stringify(await readJsonBody(request)) : undefined, cache: 'no-store',
    });
    const outgoing = new Headers({ 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' });
    for (const key of ['content-type', 'content-disposition']) {
      const value = response.headers.get(key);
      if (value) outgoing.set(key, value);
    }
    return new NextResponse(response.body, { status: response.status, headers: outgoing });
  } catch (error) {
    if (error instanceof RangeError || error instanceof SyntaxError) return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
    return NextResponse.json({ error: 'CRM unavailable' }, { status: 503 });
  }
}
export const GET = proxy;
export const POST = proxy;
