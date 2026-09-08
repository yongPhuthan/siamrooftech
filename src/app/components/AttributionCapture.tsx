'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  captureAttribution,
  trackContactClick,
  trackLineClick,
  trackPhoneClick,
} from '@/lib/gtag';
import { mintRefCode, postLeadIntake, type LeadIntakePayload } from '@/lib/lead-intake';

const LINE_LINK_SELECTOR = 'a[href*="lin.ee"], a[href*="line.me"]';

/**
 * Records a lead-intake attempt for every LINE-button click (paid or organic)
 * without changing the verified lin.ee destination on the anchor.
 */
function recordLeadForLineClick(): void {
  const refCode = mintRefCode();
  const attribution = captureAttribution();

  const payload: LeadIntakePayload = {
    ref_code: refCode,
    ...(attribution.latest_gclid && { gclid: attribution.latest_gclid }),
    ...(attribution.latest_gbraid && { gbraid: attribution.latest_gbraid }),
    ...(attribution.latest_wbraid && { wbraid: attribution.latest_wbraid }),
    ...(attribution.latest_utm_source && { utm_source: attribution.latest_utm_source }),
    ...(attribution.latest_utm_medium && { utm_medium: attribution.latest_utm_medium }),
    ...(attribution.latest_utm_campaign && { utm_campaign: attribution.latest_utm_campaign }),
    ...(attribution.latest_utm_term && { utm_term: attribution.latest_utm_term }),
    ...(attribution.latest_utm_content && { utm_content: attribution.latest_utm_content }),
    ...(attribution.latest_srt_campaignid && { srt_campaignid: attribution.latest_srt_campaignid }),
    ...(attribution.latest_srt_adgroupid && { srt_adgroupid: attribution.latest_srt_adgroupid }),
    ...(attribution.latest_srt_keyword && { srt_keyword: attribution.latest_srt_keyword }),
    ...(attribution.latest_srt_matchtype && { srt_matchtype: attribution.latest_srt_matchtype }),
    ...(attribution.latest_srt_device && { srt_device: attribution.latest_srt_device }),
    ...(attribution.first_landing_page && { landing_page: attribution.first_landing_page }),
  };

  postLeadIntake(payload);
}

export default function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || '';

  useEffect(() => {
    captureAttribution();
  }, [pathname, queryString]);

  useEffect(() => {
    const handleTrackedContactClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>('a[data-analytics-type]');

      if (!link) {
        return;
      }

      const type = link.dataset.analyticsType;
      const position = link.dataset.analyticsPosition || 'unknown';

      if (type === 'line') {
        trackLineClick(position);
        return;
      }

      if (type === 'phone') {
        const phoneNumber = link.href.replace(/^tel:/, '') || '0984542455';
        trackPhoneClick(phoneNumber, position);
        return;
      }

      if (type === 'contact') {
        trackContactClick(position);
      }
    };

    document.addEventListener('click', handleTrackedContactClick);

    return () => {
      document.removeEventListener('click', handleTrackedContactClick);
    };
  }, []);

  useEffect(() => {
    const handleLineRedirect = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>(LINE_LINK_SELECTOR);

      if (!anchor) {
        return;
      }

      // Analytics must never rewrite the verified LINE short link. Rewriting
      // it to a line.me deep link can fall back to the generic LINE homepage
      // on clients that cannot resolve that scheme.
      recordLeadForLineClick();
    };

    document.addEventListener('click', handleLineRedirect, true);

    return () => {
      document.removeEventListener('click', handleLineRedirect, true);
    };
  }, []);

  return null;
}
