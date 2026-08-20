'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  captureAttribution,
  getStoredPersona,
  isPaidLeadSession,
  setStoredPersona,
  trackContactClick,
  trackLineClick,
  trackLineSurveyComplete,
  trackLineSurveyStart,
  trackPhoneClick,
  type LeadPersona,
} from '@/lib/gtag';
import LeadSurveyModal from './LeadSurveyModal';

const LINE_LINK_SELECTOR = 'a[href*="lin.ee"], a[href*="line.me"]';

const persistLeadSurvey = (persona: LeadPersona, position: string) => {
  if (typeof window === 'undefined' || !navigator.sendBeacon) return;

  try {
    const url = new URL(window.location.href);
    const payload = {
      persona,
      score: persona === 'contractor' ? 0 : 1,
      position,
      gclid: url.searchParams.get('gclid') || undefined,
      gbraid: url.searchParams.get('gbraid') || undefined,
      wbraid: url.searchParams.get('wbraid') || undefined,
      utm_campaign: url.searchParams.get('utm_campaign') || undefined,
      utm_source: url.searchParams.get('utm_source') || undefined,
      utm_medium: url.searchParams.get('utm_medium') || undefined,
      srt_campaignid: url.searchParams.get('srt_campaignid') || undefined,
      srt_adgroupid: url.searchParams.get('srt_adgroupid') || undefined,
      srt_keyword: url.searchParams.get('srt_keyword') || undefined,
      ad_kw: url.searchParams.get('ad_kw') || undefined,
      ad_audience: url.searchParams.get('ad_audience') || undefined,
      ad_area: url.searchParams.get('ad_area') || undefined,
      ad_intent: url.searchParams.get('ad_intent') || undefined,
      landing_path: `${window.location.pathname}${window.location.search}`,
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/lead-survey', blob);
  } catch {
    // Statistics must never block the lead from reaching LINE.
  }
};

export default function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || '';
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [surveyPosition, setSurveyPosition] = useState('unknown');

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
    const handleLineGate = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>(LINE_LINK_SELECTOR);

      if (!anchor) {
        return;
      }

      if (!isPaidLeadSession() || getStoredPersona()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const position = anchor.dataset.analyticsPosition || 'unknown';
      setSurveyPosition(position);
      setPendingHref(anchor.href);
      trackLineSurveyStart(position);
    };

    document.addEventListener('click', handleLineGate, true);

    return () => {
      document.removeEventListener('click', handleLineGate, true);
    };
  }, []);

  const handleSurveyAnswer = useCallback(
    (persona: LeadPersona) => {
      setStoredPersona(persona);
      trackLineSurveyComplete(persona, surveyPosition);
      persistLeadSurvey(persona, surveyPosition);

      if (pendingHref) {
        window.open(pendingHref, '_blank', 'noopener,noreferrer');
      }

      setPendingHref(null);
    },
    [pendingHref, surveyPosition],
  );

  return <LeadSurveyModal isOpen={pendingHref !== null} onAnswer={handleSurveyAnswer} />;
}
