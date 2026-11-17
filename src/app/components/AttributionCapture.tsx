'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  captureAttribution,
  trackContactClick,
  trackLineClick,
  trackPhoneClick,
} from '@/lib/gtag';
import { measureOpenAICustom, measureOpenAIPageView } from '@/features/openai-ads/measure';
import { OPENAI_CUSTOM_EVENTS } from '@/features/openai-ads/pixel-config';

export default function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || '';

  useEffect(() => {
    captureAttribution();
    measureOpenAIPageView();
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
        measureOpenAICustom(OPENAI_CUSTOM_EVENTS.lineClick);
        return;
      }

      if (type === 'phone') {
        const phoneNumber = link.href.replace(/^tel:/, '') || '0984542455';
        trackPhoneClick(phoneNumber, position);
        measureOpenAICustom(OPENAI_CUSTOM_EVENTS.phoneClick);
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

  return null;
}
