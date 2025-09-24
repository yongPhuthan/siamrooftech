// Google Analytics และ Google Ads Conversion Tracking
// ใช้สำหรับติดตาม events และ conversions

// Type definitions สำหรับ gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: {
        [key: string]: any;
        event_callback?: () => void;
        send_to?: string;
        value?: number;
        currency?: string;
      }
    ) => void;
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

// Google Ads Conversion IDs และ Labels
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'AW-17594563828';

// Conversion Labels สำหรับ Google Ads (อ่านจาก environment variables)
export const CONVERSION_LABELS = {
  CONTACT: process.env.NEXT_PUBLIC_CONVERSION_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB', // Label สำหรับการติดต่อ
  LINE_CLICK: process.env.NEXT_PUBLIC_LINE_CONVERSION_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB', // ใช้ label เดียวกันหรือสร้างใหม่
  PHONE_CLICK: process.env.NEXT_PUBLIC_PHONE_CONVERSION_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB', // ใช้ label เดียวกันหรือสร้างใหม่
  QUOTE_REQUEST: process.env.NEXT_PUBLIC_QUOTE_CONVERSION_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB', // ใช้ label เดียวกันหรือสร้างใหม่
  
  // Line Button Labels ตามตำแหน่ง
  LINE_HERO: process.env.NEXT_PUBLIC_LINE_HERO_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB',
  LINE_MIDDLE: process.env.NEXT_PUBLIC_LINE_MIDDLE_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB',
  LINE_BOTTOM: process.env.NEXT_PUBLIC_LINE_BOTTOM_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB',
  LINE_MOBILE: process.env.NEXT_PUBLIC_LINE_MOBILE_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB',
  LINE_DESKTOP: process.env.NEXT_PUBLIC_LINE_DESKTOP_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB',
  
  // Portfolio Button Label
  PORTFOLIO_VIEW: process.env.NEXT_PUBLIC_PORTFOLIO_VIEW_LABEL || 'Kx9vCO6Q-oIbEOHN8YNB'
};

// ฟังก์ชันหลักสำหรับ Conversion Tracking
export const trackConversion = (
  conversionLabel: string,
  value: number = 1.0,
  currency: string = 'THB'
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GA_TRACKING_ID}/${conversionLabel}`,
      value: value,
      currency: currency,
    });
  }
};

// ติดตามการคลิกปุ่มติดต่อ
export const trackContactClick = () => {
  trackConversion(CONVERSION_LABELS.CONTACT, 1.0, 'THB');
  
  // เพิ่ม GA4 event tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'contact_click', {
      event_category: 'engagement',
      event_label: 'contact_button',
      value: 1
    });
  }
};

// ติดตามการคลิกปุ่ม Line
export const trackLineClick = () => {
  // ใช้ conversion label เดียวกับ contact หรือสร้างใหม่
  trackConversion(CONVERSION_LABELS.CONTACT, 1.0, 'THB');
  
  // เพิ่ม GA4 event tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'line_click', {
      event_category: 'engagement',
      event_label: 'line_button',
      value: 1
    });
  }
};

// ติดตามการคลิกเบอร์โทรศัพท์
export const trackPhoneClick = (phoneNumber: string) => {
  trackConversion(CONVERSION_LABELS.CONTACT, 1.0, 'THB');
  
  // เพิ่ม GA4 event tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'phone_click', {
      event_category: 'engagement',
      event_label: 'phone_call',
      phone_number: phoneNumber,
      value: 1
    });
  }
};

// ติดตามการส่งฟอร์มขอใบเสนอราคา
export const trackQuoteRequest = (formType: string = 'contact_form') => {
  trackConversion(CONVERSION_LABELS.CONTACT, 5.0, 'THB'); // มูลค่าสูงกว่าเพราะเป็น lead ที่ดี
  
  // เพิ่ม GA4 event tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'quote_request', {
      event_category: 'conversion',
      event_label: formType,
      value: 5
    });
  }
};

// ติดตามการดูหน้า Portfolio (Optional)
export const trackPortfolioView = (portfolioTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'portfolio_view', {
      event_category: 'engagement',
      event_label: 'portfolio_page',
      portfolio_title: portfolioTitle,
      value: 1
    });
  }
};

// ติดตาม Line Button ตามตำแหน่งต่างๆ
export const trackLineClickHero = () => {
  trackConversion(CONVERSION_LABELS.LINE_HERO, 1.0, 'THB');
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'line_click_hero', {
      event_category: 'engagement',
      event_label: 'line_button_hero_section',
      value: 1
    });
  }
  debugTracking('Line Click Hero', { label: CONVERSION_LABELS.LINE_HERO });
};

export const trackLineClickMiddle = () => {
  trackConversion(CONVERSION_LABELS.LINE_MIDDLE, 1.0, 'THB');
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'line_click_middle', {
      event_category: 'engagement',
      event_label: 'line_button_middle_section',
      value: 1
    });
  }
  debugTracking('Line Click Middle', { label: CONVERSION_LABELS.LINE_MIDDLE });
};

export const trackLineClickBottom = () => {
  trackConversion(CONVERSION_LABELS.LINE_BOTTOM, 1.0, 'THB');
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'line_click_bottom', {
      event_category: 'engagement',
      event_label: 'line_button_bottom_section',
      value: 1
    });
  }
  debugTracking('Line Click Bottom', { label: CONVERSION_LABELS.LINE_BOTTOM });
};

export const trackLineClickMobile = () => {
  trackConversion(CONVERSION_LABELS.LINE_MOBILE, 1.0, 'THB');
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'line_click_mobile', {
      event_category: 'engagement',
      event_label: 'line_button_mobile_sticky',
      value: 1
    });
  }
  debugTracking('Line Click Mobile', { label: CONVERSION_LABELS.LINE_MOBILE });
};

export const trackLineClickDesktop = () => {
  trackConversion(CONVERSION_LABELS.LINE_DESKTOP, 1.0, 'THB');
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'line_click_desktop', {
      event_category: 'engagement',
      event_label: 'line_button_desktop_fixed',
      value: 1
    });
  }
  debugTracking('Line Click Desktop', { label: CONVERSION_LABELS.LINE_DESKTOP });
};

// ติดตามการคลิกปุ่มดูผลงาน
export const trackPortfolioButtonClick = () => {
  trackConversion(CONVERSION_LABELS.PORTFOLIO_VIEW, 2.0, 'THB'); // มูลค่าสูงกว่าเพราะแสดงความสนใจในผลงาน
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'portfolio_view_click', {
      event_category: 'navigation',
      event_label: 'portfolio_button',
      value: 2
    });
  }
  debugTracking('Portfolio Button Click', { label: CONVERSION_LABELS.PORTFOLIO_VIEW });
};

// Helper function สำหรับ debug (เฉพาะ development)
export const debugTracking = (eventName: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GTAG Debug] ${eventName}:`, data);
  }
};