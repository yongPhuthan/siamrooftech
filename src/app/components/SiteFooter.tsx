'use client';

import { usePathname } from 'next/navigation';
import Footer from './ui/Footer';
import { hidesSiteChrome, isAdLandingPage } from '@/lib/layout-config';

/** Shared footer on every public page; admin screens opt out. */
export default function SiteFooter() {
  const pathname = usePathname();

  if (hidesSiteChrome(pathname)) {
    return null;
  }

  return <Footer showServiceLinks={!isAdLandingPage(pathname)} />;
}
