import type { Metadata } from 'next';
import HomePageContent from '@/app/components/HomePageContent';
import { canonicalUrl } from '@/lib/seo-config';

export const dynamic = 'force-static';
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: canonicalUrl('/'),
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function RetractableAwningGoogleAdsLandingPage() {
  return <HomePageContent />;
}
