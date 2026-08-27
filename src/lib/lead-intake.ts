'use client';

// Client-side half of lead <-> gclid matching. See docs/lead-matching/README.md
// for the full flow. A ref code is minted here (not waited-for from the
// server) so opening LINE never has to pause for a network round trip —
// the server (workers/line-chat-history/src/leads.ts createLead) just
// records the same code, and the webhook later looks it up when the
// visitor's first LINE message arrives.

// Crockford-style alphabet (no 0/O, 1/I/L, U) — must match
// workers/line-chat-history/src/leads.ts REF_CODE_ALPHABET exactly, since
// the webhook parses this exact character set out of the message text.
const REF_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const REF_CODE_LENGTH = 8;

// The OA's basic ID, percent-encoded (@ -> %40) for the oaMessage URL scheme.
// See https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/
const LINE_OA_ID_ENCODED = '%40siamrooftech';
const LINE_PREFILL_MESSAGE = 'สอบถามข้อมูลกันสาดจากเว็บไซต์ครับ/ค่ะ';

export function mintRefCode(): string {
  const bytes = new Uint8Array(REF_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const byte of bytes) suffix += REF_CODE_ALPHABET[byte % REF_CODE_ALPHABET.length];
  return `SRT-${suffix}`;
}

/**
 * Builds a LINE URL that opens a chat with the OA and prefills the message
 * box with our text + the ref code, e.g. "...กันสาดจากเว็บไซต์ [SRT-K3F9QA2M]".
 * The visitor still has to tap send — if they clear the prefilled text
 * first, the lead stays unmatched (surfaced in the dashboard for manual
 * matching). Not yet verified on-device (iOS/Android/desktop, friend vs.
 * not-yet-friend) — see docs/lead-matching/README.md "Manual verification".
 */
export function buildLineOaMessageHref(refCode: string): string {
  const message = `${LINE_PREFILL_MESSAGE} [${refCode}]`;
  return `https://line.me/R/oaMessage/${LINE_OA_ID_ENCODED}/?${encodeURIComponent(message)}`;
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
