'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getLineCtaPositions, hidesSiteChrome, isAdLandingPage } from '@/lib/layout-config';
import LineButtonDesktop from './LineButtonDesktop';
import LineButtonMobile from './LineButtonMobile';

/** Sticky LINE buttons on every public page; admin screens opt out. */
export default function LineButtonsLayout() {
  const pathname = usePathname();
  const adLandingPage = isAdLandingPage(pathname);
  const [showAdLandingDesktopButton, setShowAdLandingDesktopButton] = useState(false);
  const [showAdLandingMobileButton, setShowAdLandingMobileButton] = useState(true);

  useEffect(() => {
    if (!adLandingPage) {
      setShowAdLandingDesktopButton(false);
      setShowAdLandingMobileButton(true);
      return;
    }

    const start = document.querySelector<HTMLElement>('[data-floating-cta-start]');
    const stop = document.querySelector<HTMLElement>('[data-floating-cta-stop]');
    const blockers = Array.from(
      document.querySelectorAll<HTMLElement>('[data-floating-cta-blocker]'),
    );

    if (!start || !stop) {
      setShowAdLandingDesktopButton(false);
      setShowAdLandingMobileButton(true);
      return;
    }

    const isInViewport = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    const updateVisibility = () => {
      const startRect = start.getBoundingClientRect();
      const hasPassedHero = startRect.bottom <= 0;
      const finalCtaIsVisible = isInViewport(stop);
      const inlineCtaIsVisible = blockers.some(isInViewport);

      setShowAdLandingDesktopButton(
        hasPassedHero && !inlineCtaIsVisible && !finalCtaIsVisible,
      );
      setShowAdLandingMobileButton(!finalCtaIsVisible);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [adLandingPage, pathname]);

  if (hidesSiteChrome(pathname)) {
    return null;
  }

  const positions = getLineCtaPositions(pathname);
  const showFloatingDesktopButton = !adLandingPage || showAdLandingDesktopButton;
  const showStickyMobileButton = !adLandingPage || showAdLandingMobileButton;

  return (
    <>
      {showStickyMobileButton && <LineButtonMobile analyticsPosition={positions.stickyMobile} />}
      {showFloatingDesktopButton && <LineButtonDesktop analyticsPosition={positions.stickyDesktop} />}
    </>
  );
}
