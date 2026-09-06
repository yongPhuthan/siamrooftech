'use client';

import { sendGTMEvent } from '@next/third-parties/google';

type GTMEventPayload = Record<string, unknown>;
type StoredAttribution = Record<string, string>;

const ATTRIBUTION_STORAGE_KEY = 'siamrooftech_attribution_v1';
const PAID_LEAD_COOKIE_NAME = 'srt_paid';

export type LeadPersona = 'homeowner' | 'procurement' | 'contractor';

export const LEAD_PERSONAS: Record<LeadPersona, { score: 0 | 1; value: 0 | 1 }> = {
  homeowner: { score: 1, value: 1 },
  procurement: { score: 1, value: 1 },
  contractor: { score: 0, value: 0 },
};
const TRACKED_QUERY_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'gad_source',
  'gad_campaignid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'srt_platform',
  'srt_campaignid',
  'srt_adgroupid',
  'srt_adid',
  'srt_keyword',
  'srt_matchtype',
  'srt_device',
  'srt_network',
  'srt_location',
  'ad_kw',
  'ad_audience',
  'ad_area',
  'ad_intent',
] as const;

const readStoredAttribution = (): StoredAttribution => {
  try {
    const stored = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as StoredAttribution;
  } catch {
    return {};
  }
};

const writeStoredAttribution = (data: StoredAttribution) => {
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage can be unavailable in strict browser privacy modes.
  }
};

const getCurrentPageContext = (): GTMEventPayload => {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
  };
};

const getFunnelContext = (): GTMEventPayload => {
  if (typeof window === 'undefined') {
    return {};
  }

  const viewportCenter = window.innerHeight / 2;
  const activeSection = Array.from(
    document.querySelectorAll<HTMLElement>('[data-funnel-section]'),
  ).find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= viewportCenter && rect.bottom >= viewportCenter;
  });
  const scrollableDistance = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    0,
  );
  const scrollDepthPercent = scrollableDistance === 0
    ? 0
    : Math.min(100, Math.max(0, Math.round((window.scrollY / scrollableDistance) * 100)));

  return {
    active_section: activeSection?.dataset.funnelSection || 'unknown',
    scroll_depth_percent: scrollDepthPercent,
  };
};

const toEventAttributionParams = (data: StoredAttribution): GTMEventPayload => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [`attribution_${key}`, value]),
  );
};

export const captureAttribution = (): StoredAttribution => {
  if (typeof window === 'undefined') {
    return {};
  }

  const now = new Date().toISOString();
  const url = new URL(window.location.href);
  const stored = readStoredAttribution();
  const next: StoredAttribution = {
    ...stored,
    first_landing_page: stored.first_landing_page || window.location.href,
    first_landing_path: stored.first_landing_path || `${window.location.pathname}${window.location.search}`,
    first_seen_at: stored.first_seen_at || now,
    latest_landing_page: window.location.href,
    latest_landing_path: `${window.location.pathname}${window.location.search}`,
    latest_seen_at: now,
  };

  TRACKED_QUERY_KEYS.forEach((key) => {
    const value = url.searchParams.get(key);
    if (!value) {
      return;
    }

    next[`first_${key}`] = next[`first_${key}`] || value;
    next[`latest_${key}`] = value;
  });

  writeStoredAttribution(next);
  return next;
};

export const isPaidLeadSession = (): boolean => {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie
    .split('; ')
    .some((entry) => entry === `${PAID_LEAD_COOKIE_NAME}=1`);
};

export const getStoredPersona = (): LeadPersona | null => {
  const stored = readStoredAttribution();
  const persona = stored.lead_persona;

  if (persona === 'homeowner' || persona === 'procurement' || persona === 'contractor') {
    return persona;
  }

  return null;
};

export const setStoredPersona = (persona: LeadPersona): void => {
  const stored = readStoredAttribution();
  const { score } = LEAD_PERSONAS[persona];

  writeStoredAttribution({
    ...stored,
    lead_persona: persona,
    lead_quality_score: String(score),
    lead_survey_answered_at: new Date().toISOString(),
  });
};

const trackEvent = (payload: GTMEventPayload) => {
  if (typeof window === 'undefined') return;

  const attribution = captureAttribution();

  sendGTMEvent({
    ...getCurrentPageContext(),
    ...toEventAttributionParams(attribution),
    ...payload,
  });
};

export const trackContactClick = (position: string = 'unknown') => {
  trackEvent({
    event: 'contact_click',
    event_category: 'engagement',
    event_label: 'contact_button',
    position,
    value: 1,
  });
};

export const trackLineClick = (position: string = 'unknown') => {
  trackEvent({
    event: 'line_click',
    event_category: 'engagement',
    event_label: 'line_button',
    lead_type: 'line',
    conversion_priority: 'secondary',
    position,
    ...getFunnelContext(),
  });
};

export const trackLineSurveyStart = (position: string = 'unknown') => {
  trackEvent({
    event: 'line_survey_start',
    event_category: 'engagement',
    event_label: 'line_survey',
    position,
  });
};

export const trackLineSurveyComplete = (persona: LeadPersona, position: string = 'unknown') => {
  const { score, value } = LEAD_PERSONAS[persona];

  trackEvent({
    event: 'line_survey_complete',
    event_category: 'conversion',
    event_label: 'line_survey',
    lead_type: 'line',
    lead_persona: persona,
    lead_quality_score: score,
    conversion_priority: 'primary',
    position,
    value,
    currency: 'THB',
  });
};

export const trackPhoneClick = (phoneNumber: string, position: string = 'unknown') => {
  trackEvent({
    event: 'phone_click',
    event_category: 'engagement',
    event_label: 'phone_call',
    lead_type: 'phone',
    conversion_priority: 'primary',
    phone_number: phoneNumber,
    position,
    value: 1,
  });
};

export const trackQuoteRequest = (formType: string = 'contact_form') => {
  trackEvent({
    event: 'quote_request',
    event_category: 'conversion',
    event_label: formType,
    form_type: formType,
    value: 5,
    currency: 'THB',
  });
};

export const trackContactFormSubmitSuccess = (subject: string) => {
  trackEvent({
    event: 'contact_form_submit_success',
    event_category: 'conversion',
    event_label: subject || 'unknown',
    subject: subject || 'unknown',
    value: 1,
  });
};

export const trackPortfolioButtonClick = (position: string = 'unknown') => {
  trackEvent({
    event: 'portfolio_view_click',
    event_category: 'navigation',
    event_label: 'portfolio_button',
    conversion_priority: 'secondary',
    position,
    value: 2,
  });
};

export const trackLineClickHero = () => trackLineClick('hero');
export const trackLineClickMiddle = () => trackLineClick('middle');
export const trackLineClickBottom = () => trackLineClick('bottom');
export const trackLineClickMobile = () => trackLineClick('mobile');
export const trackLineClickDesktop = () => trackLineClick('desktop');
