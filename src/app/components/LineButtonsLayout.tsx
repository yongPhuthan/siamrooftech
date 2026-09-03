'use client';

import { usePathname } from 'next/navigation';
import LineButtonMobile from './LineButtonMobile';
import LineButtonDesktop from './LineButtonDesktop';
import { getLineCtaPositions, hidesSiteChrome, isAdLandingPage } from '@/lib/layout-config';

/** Sticky LINE buttons on every public page; admin screens opt out. */
export default function LineButtonsLayout() {
  const pathname = usePathname();

  if (hidesSiteChrome(pathname)) {
    return null;
  }

  const positions = getLineCtaPositions(pathname);
  // Ad landing pages already show a persistent LINE CTA in the sticky navbar
  // on desktop; a second floating button there would just compete with it.
  const showFloatingDesktopButton = !isAdLandingPage(pathname);

  return (
    <>
      <LineButtonMobile analyticsPosition={positions.stickyMobile} />
      {showFloatingDesktopButton && <LineButtonDesktop analyticsPosition={positions.stickyDesktop} />}
    </>
  );
}
