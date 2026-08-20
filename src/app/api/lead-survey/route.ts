import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const VALID_PERSONAS = ['homeowner', 'procurement', 'contractor'] as const;
type LeadPersona = (typeof VALID_PERSONAS)[number];

interface LeadSurveyBody {
  persona: LeadPersona;
  score: 0 | 1;
  position: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  srt_campaignid?: string;
  srt_adgroupid?: string;
  srt_keyword?: string;
  ad_kw?: string;
  ad_audience?: string;
  ad_area?: string;
  ad_intent?: string;
  landing_path?: string;
}

function isValidBody(body: unknown): body is LeadSurveyBody {
  if (!body || typeof body !== 'object') return false;
  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.persona === 'string' &&
    VALID_PERSONAS.includes(candidate.persona as LeadPersona) &&
    (candidate.score === 0 || candidate.score === 1)
  );
}

// POST: บันทึกคำตอบ survey ก่อนเข้า LINE (fire-and-forget จาก client, ไม่บล็อกการเปิด LINE)
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not available' }, { status: 500 });
    }

    const body = await request.json();

    if (!isValidBody(body)) {
      return NextResponse.json({ error: 'Invalid lead survey payload' }, { status: 400 });
    }

    await adminDb.collection('leadSurveys').add({
      ...body,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('lead-survey POST error:', error);
    return NextResponse.json({ error: 'Failed to record lead survey' }, { status: 500 });
  }
}
