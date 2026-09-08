'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/gtag';
import { LINE_CONTACT_URL } from './constants';
import { mintRefCode, postLeadIntake, type LeadIntakePayload } from './lead-intake';

const LINE_LINK_SELECTOR = `a[href="${LINE_CONTACT_URL}"]`;

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

/** Records diagnostics without taking ownership of the anchor navigation. */
export default function LineLeadCapture() {
  useEffect(() => {
    const handleLineClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>(LINE_LINK_SELECTOR);
      if (anchor) recordLeadForLineClick();
    };

    document.addEventListener('click', handleLineClick, true);
    return () => document.removeEventListener('click', handleLineClick, true);
  }, []);

  return null;
}
