import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody } from '@/features/lead-crm/json-body';
import { adsTouchSchema } from '@/features/lead-crm/contracts';

/**
 * Public, unauthenticated proxy: forwards lead-intake payloads from
 * anonymous site visitors (fired from AttributionCapture.tsx when a LINE
 * button is clicked) to the line-chat-history Worker's internal intake
 * endpoint. The Worker endpoint itself requires LEADS_INTAKE_TOKEN, which
 * is never exposed to the browser — this route is the only thing allowed
 * to hold it.
 *
 * Same reasoning as /api/upload/presign: same-origin call from the browser,
 * server-to-server call to the actual Cloudflare Worker.
 */
export async function POST(request: NextRequest) {
  const receivedAt = Date.now();
  try {
    const origin = request.headers.get('origin');
    if (!origin || new URL(origin).host !== request.headers.get('host')) {
      return NextResponse.json({ error: 'invalid origin' }, { status: 403 });
    }
  } catch { return NextResponse.json({ error: 'invalid origin' }, { status: 403 }); }
  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const workerUrl = process.env.LINE_CHAT_HISTORY_WORKER_URL;
  const parsed = adsTouchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid attribution' }, { status: 400 });
  const token = process.env.LEADS_INTAKE_TOKEN;
  if (!workerUrl || !token) {
    console.error('LINE_CHAT_HISTORY_WORKER_URL or LEADS_INTAKE_TOKEN not configured');
    return NextResponse.json({ error: 'lead intake not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${workerUrl.replace(/\/$/, '')}/internal/leads/intake`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-crm-click-at': String(receivedAt),
      },
      body: JSON.stringify(parsed.data),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('lead intake proxy failed', error);
    // Fire-and-forget from the caller's perspective: a lead that fails to
    // record server-side must never block the visitor from reaching LINE.
    return NextResponse.json({ error: 'lead intake failed' }, { status: 502 });
  }
}
