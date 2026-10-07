import { NextResponse } from 'next/server';
import { createContactSubmission } from '@/features/contact/server/repository';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as unknown;
  try {
    const submission = await createContactSubmission(body, request.headers.get('cf-connecting-ip'));
    return NextResponse.json({ success: true, ...submission }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'INVALID_CONTACT' ? 400 : code === 'CONTACT_RATE_LIMITED' ? 429 : 503;
    return NextResponse.json({ error: status === 400 ? 'Invalid contact details' : status === 429 ? 'Too many submissions. Please try again later.' : 'Contact form is unavailable.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
