'use client';

import { usePathname } from 'next/navigation';
import LineButtonMobile from './LineButtonMobile';
import LineButtonDesktop from './LineButtonDesktop';

/**
 * Component to display Line buttons on all pages except admin pages
 */
export default function LineButtonsLayout() {
  const pathname = usePathname();

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Mobile Sticky Line Button */}
      <LineButtonMobile />

      {/* Desktop Floating Line Button */}
      <LineButtonDesktop />
    </>
  );
}
