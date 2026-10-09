import type { Metadata } from 'next';
import HomePageContent from '@/app/components/HomePageContent';
import { canonicalUrl } from '@/lib/seo-config';

export const metadata: Metadata = {
  alternates: {
    canonical: canonicalUrl('/'),
  },
};

export const dynamic = 'force-dynamic';

export default function Home() {
  return <HomePageContent />;
}
