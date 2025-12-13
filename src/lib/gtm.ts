'use client';

import { sendGTMEvent } from '@next/third-parties/google';

type GTMEventPayload = Record<string, unknown>;

const trackEvent = (payload: GTMEventPayload) => {
  if (typeof window === 'undefined') return;

  sendGTMEvent(payload);
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
    position,
    value: 1,
  });
};

export const trackPhoneClick = (phoneNumber: string, position: string = 'unknown') => {
  trackEvent({
    event: 'phone_click',
    event_category: 'engagement',
    event_label: 'phone_call',
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
    position,
    value: 2,
  });
};

export const trackLineClickHero = () => trackLineClick('hero');
export const trackLineClickMiddle = () => trackLineClick('middle');
export const trackLineClickBottom = () => trackLineClick('bottom');
export const trackLineClickMobile = () => trackLineClick('mobile');
export const trackLineClickDesktop = () => trackLineClick('desktop');
