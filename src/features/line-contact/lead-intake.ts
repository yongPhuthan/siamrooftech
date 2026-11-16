'use client';
import { ATTRIBUTION_KEYS, LANDING_REGISTRY, type LandingId } from '@/features/lead-crm/attribution';
import type { AdsTouch } from '@/features/lead-crm/contracts';

/** Uses only this page's URL; old analytics localStorage is deliberately ignored. */
export function buildAdsTouch(pathname: string, query: string, sessionId: string): AdsTouch | null {
  const landingId = (Object.keys(LANDING_REGISTRY) as LandingId[]).find((id) => LANDING_REGISTRY[id] === pathname);
  if (!landingId) return null;
  const params = new URLSearchParams(query);
  const attribution = Object.fromEntries(ATTRIBUTION_KEYS.flatMap((key) => {
    const value = params.get(key);
    return value && value.length <= 512 ? [[key, value]] : [];
  }));
  return { click_id: crypto.randomUUID(), session_id: sessionId, landing_id: landingId,
    landing_path: LANDING_REGISTRY[landingId], attribution };
}
export function postLeadIntake(payload: AdsTouch): void {
  try {
    void fetch('/api/leads/intake', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload), keepalive: true }).catch(() => {});
  } catch { /* Transport failure never owns native navigation. */ }
}
