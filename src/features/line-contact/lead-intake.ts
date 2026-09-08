'use client';

// Client-side lead-intake capture. The verified lin.ee contact URL remains
// untouched so analytics can never interfere with opening the LINE OA.

// Crockford-style alphabet (no 0/O, 1/I/L, U) — must match
// workers/line-chat-history/src/leads.ts REF_CODE_ALPHABET exactly, since
// the webhook parses this exact character set out of legacy/manual messages.
const REF_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const REF_CODE_LENGTH = 8;

export function mintRefCode(): string {
  const bytes = new Uint8Array(REF_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const byte of bytes) suffix += REF_CODE_ALPHABET[byte % REF_CODE_ALPHABET.length];
  return `SRT-${suffix}`;
}

export interface LeadIntakePayload {
  ref_code: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  lead_persona?: string;
  lead_quality_score?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  srt_campaignid?: string;
  srt_adgroupid?: string;
  srt_keyword?: string;
  srt_matchtype?: string;
  srt_device?: string;
  landing_page?: string;
}

/**
 * Fire-and-forget: a lead that fails to record server-side must never
 * delay or block the visitor from reaching LINE. Uses keepalive so the
 * request can survive the page navigating away right after this fires.
 */
export function postLeadIntake(payload: LeadIntakePayload): void {
  try {
    fetch('/api/leads/intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((error) => {
      console.error('lead intake failed', error);
    });
  } catch (error) {
    console.error('lead intake failed', error);
  }
}
