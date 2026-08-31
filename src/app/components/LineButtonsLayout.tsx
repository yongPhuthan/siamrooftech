'use client';

import { usePathname } from 'next/navigation';
import LineButtonMobile from './LineButtonMobile';
import LineButtonDesktop from './LineButtonDesktop';

/**
 * Component to display Line buttons on all pages except admin pages
 */
export default function LineButtonsLayout() {
  const pathname = usePathname();

  // Dedicated ad pages own their single-purpose sticky CTA.
  if (pathname?.startsWith('/admin') || pathname === '/lp/google-ads/electric-awning') {
    return null;
  }

  return (
    <>
      {/* Mobile Sticky Line Button */}
      <LineButtonMobile compactCorners={pathname === '/'} />

      {/* Desktop Floating Line Button */}
      <LineButtonDesktop compactCorners={pathname === '/'} />
    </>
  );
}
