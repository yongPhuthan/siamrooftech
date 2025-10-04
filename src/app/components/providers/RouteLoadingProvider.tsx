'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * RouteLoadingProvider - Shows loading indicator during route transitions
 *
 * Features:
 * - Automatic detection of route changes
 * - Full-screen loading overlay
 * - Smooth fade in/out
 * - Prevents layout shift
 */
export default function RouteLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    // Route changed
    if (pathname !== prevPathname) {
      setLoading(true);
      setPrevPathname(pathname);

      // Show loading for minimum 300ms to avoid flicker
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname, prevPathname]);

  return (
    <>
      {loading && <LoadingSpinner fullScreen />}
      {children}
    </>
  );
}
