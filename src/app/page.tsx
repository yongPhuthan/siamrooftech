import type { Metadata } from 'next';
import HomePageContent from '@/app/components/HomePageContent';
import { canonicalUrl } from '@/lib/seo-config';

export const metadata: Metadata = {
  alternates: {
    canonical: canonicalUrl('/'),
  },
};

// Keep the homepage and its paid-traffic mirror fresh with the same ISR window.
export const revalidate = 60;

export default function Home() {
  return <HomePageContent />;
}
