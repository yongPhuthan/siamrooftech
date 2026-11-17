import { isValidCustomEventName, OPENAI_LEAD_EVENT } from './pixel-config';

type OaiqFn = (...args: unknown[]) => void;
declare global {
  interface Window { oaiq?: OaiqFn }
}

function oaiq(): OaiqFn | null {
  return typeof window !== 'undefined' && typeof window.oaiq === 'function' ? window.oaiq : null;
}

/**
 * Fire-and-forget page view. No-op when the Pixel is not installed. Never
 * throws: measurement must not affect navigation or rendering.
 */
export function measureOpenAIPageView(): void {
  try {
    oaiq()?.('measure', 'page_viewed', { type: 'contents' });
  } catch { /* Measurement is secondary. */ }
}

/**
 * Fire-and-forget custom event (e.g. `line_click`). Callers must invoke this
 * from a passive listener and must never await it or alter the click.
 */
export function measureOpenAICustom(name: string, eventId?: string): void {
  try {
    const fn = oaiq();
    if (!fn || !isValidCustomEventName(name)) return;
    fn('measure', 'custom', { type: 'custom' }, {
      custom_event_name: name,
      ...(eventId ? { event_id: eventId } : {}),
    });
  } catch { /* Measurement is secondary. */ }
}

/**
 * Fire-and-forget standard `lead_created` (customer_action) with a unique
 * `event_id`, so a later server event for the same action can deduplicate.
 * Returns the event_id, or null when the Pixel is not installed.
 */
export function measureOpenAILead(eventId: string = newEventId()): string | null {
  try {
    const fn = oaiq();
    if (!fn) return null;
    fn('measure', OPENAI_LEAD_EVENT, { type: 'customer_action' }, { event_id: eventId });
    return eventId;
  } catch {
    return null;
  }
}

function newEventId(): string {
  try {
    return `line_${crypto.randomUUID()}`;
  } catch {
    return `line_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
