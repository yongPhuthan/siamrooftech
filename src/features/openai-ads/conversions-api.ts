// Server-only OpenAI Ads Conversions API client.
// Docs: https://developers.openai.com/ads/conversion-tracking
// Pure payload policy first, then a thin fetch adapter. Requests default to
// `validate_only: true`; sending live events requires an explicit opt-in.
import { isValidCustomEventName, normalizePixelId, STANDARD_EVENT_NAMES } from './pixel-config';

export const OPENAI_CAPI_ENDPOINT = 'https://bzr.openai.com/v1/events';
export const OPENAI_CAPI_MAX_EVENTS = 1000;

type StandardEventName = (typeof STANDARD_EVENT_NAMES)[number];

export interface ConversionEventInput {
  /** Deterministic ID; must equal the Pixel's `event_id` for the same action. */
  id: string;
  type: StandardEventName | 'custom';
  customEventName?: string;
  timestampMs: number;
  sourceUrl?: string;
  /** Original `oppref` value from the ad click (`__oppref` cookie or URL). */
  oppref?: string;
  /** Integer amount in the currency's minor unit (THB satang). */
  amount?: number;
  currency?: string;
}

const CUSTOMER_ACTION_EVENTS = new Set(['lead_created', 'registration_completed', 'appointment_scheduled', 'app_installed', 'app_opened']);
const PLAN_EVENTS = new Set(['subscription_created', 'trial_started']);

function dataType(type: ConversionEventInput['type']): string {
  if (type === 'custom') return 'custom';
  if (CUSTOMER_ACTION_EVENTS.has(type)) return 'customer_action';
  if (PLAN_EVENTS.has(type)) return 'plan_enrollment';
  return 'contents';
}

export function buildConversionEvent(input: ConversionEventInput): Record<string, unknown> {
  const id = input.id.trim();
  if (!id || id.length > 256) throw new Error('event id must be 1-256 characters');
  if (!Number.isSafeInteger(input.timestampMs) || input.timestampMs <= 0) {
    throw new Error('timestampMs must be Unix milliseconds');
  }
  if (input.type === 'custom') {
    if (!input.customEventName || !isValidCustomEventName(input.customEventName)) {
      throw new Error('custom events need a valid custom_event_name');
    }
  } else if (input.customEventName) {
    throw new Error('custom_event_name is only allowed on custom events');
  }
  const data: Record<string, unknown> = { type: dataType(input.type) };
  if (input.amount !== undefined) {
    if (!Number.isSafeInteger(input.amount) || input.amount < 0) throw new Error('amount must be a non-negative integer in minor units');
    if (!input.currency || !/^[A-Z]{3}$/.test(input.currency)) throw new Error('currency (ISO 4217) is required with amount');
    data.amount = input.amount;
    data.currency = input.currency;
  }
  return {
    id,
    type: input.type,
    ...(input.customEventName ? { custom_event_name: input.customEventName } : {}),
    timestamp_ms: input.timestampMs,
    action_source: 'web',
    ...(input.sourceUrl ? { source_url: input.sourceUrl } : {}),
    ...(input.oppref ? { oppref: input.oppref } : {}),
    data,
  };
}

/**
 * Builds the whole batch up front: OpenAI rejects a batch if any single event
 * is invalid, so every event is validated before anything is sent.
 */
export function buildConversionsBody(events: ConversionEventInput[], options: { live?: boolean } = {}) {
  if (events.length === 0 || events.length > OPENAI_CAPI_MAX_EVENTS) {
    throw new Error(`a batch must contain 1-${OPENAI_CAPI_MAX_EVENTS} events`);
  }
  return {
    ...(options.live === true ? {} : { validate_only: true }),
    events: events.map(buildConversionEvent),
  };
}

export interface ConversionsApiConfig {
  pixelId: string | undefined;
  apiKey: string | undefined;
}

export type ConversionsApiResult =
  | { ok: true; status: number; validateOnly: boolean }
  | { ok: false; status: number | null; error: string };

/** Never logs or returns the API key or the event payload. */
export async function sendConversions(
  config: ConversionsApiConfig,
  events: ConversionEventInput[],
  options: { live?: boolean; fetchImpl?: typeof fetch } = {},
): Promise<ConversionsApiResult> {
  const pixelId = normalizePixelId(config.pixelId);
  if (!pixelId || !config.apiKey) return { ok: false, status: null, error: 'conversions api not configured' };
  const body = buildConversionsBody(events, options);
  const url = `${OPENAI_CAPI_ENDPOINT}?pid=${encodeURIComponent(pixelId)}`;
  try {
    const res = await (options.fetchImpl ?? fetch)(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, status: res.status, error: `conversions api responded ${res.status}` };
    return { ok: true, status: res.status, validateOnly: options.live !== true };
  } catch {
    return { ok: false, status: null, error: 'conversions api request failed' };
  }
}
