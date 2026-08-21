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
  trackLineSurveyDecline,
  trackLineSurveyStart,
  trackPhoneClick,
  type LeadPersona,
} from '@/lib/gtag';
import LeadSurveyModal from './LeadSurveyModal';

const LINE_LINK_SELECTOR = 'a[href*="lin.ee"], a[href*="line.me"]';

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

      if (pendingHref) {
        window.open(pendingHref, '_blank', 'noopener,noreferrer');
      }

      setPendingHref(null);
    },
    [pendingHref, surveyPosition],
  );

  const handleSurveyDecline = useCallback(() => {
    // Deliberately does not call setStoredPersona: nothing is persisted, so
    // the gate asks again next time within this paid session (including
    // after a refresh) instead of being permanently skipped like a real
    // answer would be. Declining also never opens LINE.
    trackLineSurveyDecline(surveyPosition);
    setPendingHref(null);
  }, [surveyPosition]);

  return (
    <LeadSurveyModal
      isOpen={pendingHref !== null}
      onAnswer={handleSurveyAnswer}
      onDecline={handleSurveyDecline}
    />
  );
}
