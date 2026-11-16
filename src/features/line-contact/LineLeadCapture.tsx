'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LANDING_REGISTRY } from '@/features/lead-crm/attribution';
import { buildAdsTouch, postLeadIntake } from './lead-intake';
import { LINE_CONTACT_URL } from './constants';

/** Page-scoped attribution: never reuses the global analytics localStorage. */
export default function LineLeadCapture() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useEffect(() => {
    if (!Object.values(LANDING_REGISTRY).some((path) => path === pathname)) return;
    const sessionId = crypto.randomUUID();
    const openedAt = Date.now();
    const record = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(`a[href="${LINE_CONTACT_URL}"]`)) return;
      if (Date.now() - openedAt > 30 * 60_000) return;
      try {
        const payload = buildAdsTouch(pathname, query, sessionId);
        if (payload) postLeadIntake(payload);
      } catch { /* Native navigation is independent of diagnostics. */ }
    };
    document.addEventListener('click', record, true);
    return () => document.removeEventListener('click', record, true);
  }, [pathname, query]);
  return null;
}
