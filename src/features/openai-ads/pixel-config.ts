// Browser-safe, pure policy for the OpenAI Ads Measurement Pixel.
// Docs: https://developers.openai.com/ads/measurement-pixel
export const OPENAI_PIXEL_SDK_URL = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';

// OpenAI does not publish a Pixel ID format; this conservative allow-list keeps
// a misconfigured value from ever being interpolated into inline script.
const PIXEL_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function normalizePixelId(value: string | undefined | null): string | null {
  const trimmed = value?.trim() ?? '';
  return PIXEL_ID_PATTERN.test(trimmed) ? trimmed : null;
}

/** Official loader snippet plus `init`; JSON-encoded values only. */
export function buildPixelBootstrap(pixelId: string): string {
  const safeId = normalizePixelId(pixelId);
  if (!safeId) throw new Error('Invalid OpenAI Pixel ID');
  return [
    '(function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;',
    'var js=d.createElement(s);js.async=true;js.src=u;var f=d.getElementsByTagName(s)[0];',
    `f.parentNode.insertBefore(js,f)})(window,document,"script",${JSON.stringify(OPENAI_PIXEL_SDK_URL)});`,
    `oaiq("init",{pixelId:${JSON.stringify(safeId)}});`,
  ].join('');
}

// Custom event names: 1-64 chars, lowercase letters, digits, `_` or `-`,
// starting and ending with a letter or digit, and not a standard event name.
export const STANDARD_EVENT_NAMES = [
  'page_viewed', 'contents_viewed', 'items_added', 'checkout_started', 'order_created',
  'lead_created', 'registration_completed', 'appointment_scheduled',
  'subscription_created', 'trial_started', 'app_installed', 'app_opened',
] as const;
const CUSTOM_EVENT_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/;

export function isValidCustomEventName(name: string): boolean {
  return CUSTOM_EVENT_PATTERN.test(name)
    && !(STANDARD_EVENT_NAMES as readonly string[]).includes(name);
}

/**
 * Phase A optimization goal: a LINE CTA click is reported as the standard
 * `lead_created` event, because Conversion campaigns can only optimize toward
 * a standard event. Phase B replaces it with a server-side `lead_created` for
 * a matched LINE message in a new campaign (see AGENTS.md).
 */
export const OPENAI_LEAD_EVENT = 'lead_created' as const;

/** Secondary diagnostic signals only; never a campaign's optimization goal. */
export const OPENAI_CUSTOM_EVENTS = {
  phoneClick: 'phone_click',
} as const;
