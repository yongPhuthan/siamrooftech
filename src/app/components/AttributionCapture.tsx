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
import { buildLineOaMessageHref, mintRefCode, postLeadIntake, type LeadIntakePayload } from '@/lib/lead-intake';
import LeadSurveyModal from './LeadSurveyModal';

const LINE_LINK_SELECTOR = 'a[href*="lin.ee"], a[href*="line.me"]';

/**
 * Mints a lead + ref code for every LINE-button click (paid or organic —
 * the dashboard wants organic leads too), rewrites the click target to the
 * ref-coded LINE prefill URL, and fires the intake beacon. See
 * src/lib/lead-intake.ts and docs/lead-matching/README.md.
 */
function beginLeadForLineClick(): string {
  const refCode = mintRefCode();
  const attribution = captureAttribution();

  const persona = getStoredPersona();
  const score = attribution.lead_quality_score;

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
    ...(persona && { lead_persona: persona }),
    ...(persona && score && { lead_quality_score: Number(score) }),
  };

  postLeadIntake(payload);
  return buildLineOaMessageHref(refCode);
}

export default function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || '';
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
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
        // Organic, or a paid visitor who already answered the survey in an
        // earlier session (persona is permanent in localStorage). Mint the
        // lead now (persona attaches automatically if already known) and
        // rewrite the href in place — no preventDefault, so the browser's
        // normal navigation carries the visitor to LINE with no popup-
        // blocker risk and no extra click.
        anchor.href = beginLeadForLineClick();
        return;
      }

      // First-ever paid click for this browser: intercept and survey first.
      // The lead isn't minted yet — persona is unknown until answered, and
      // the lead should carry it from the start rather than be patched
      // afterward.
      event.preventDefault();
      event.stopPropagation();

      const position = anchor.dataset.analyticsPosition || 'unknown';
      setSurveyPosition(position);
      setIsSurveyOpen(true);
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

      // Mint + open synchronously in the same click-handler call stack as
      // the button press (required to avoid popup blockers) — persona is
      // already in localStorage from setStoredPersona above, so it's
      // included in the intake payload.
      const href = beginLeadForLineClick();
      window.open(href, '_blank', 'noopener,noreferrer');

      setIsSurveyOpen(false);
    },
    [surveyPosition],
  );

  return <LeadSurveyModal isOpen={isSurveyOpen} onAnswer={handleSurveyAnswer} />;
}
