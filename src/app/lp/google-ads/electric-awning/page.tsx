import type { Metadata } from 'next';
import { ElectricAwningAdsLanding, electricAwningAdsMetadata } from '@/app/components/google-ads/ElectricAwningAdsLanding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = electricAwningAdsMetadata;

export default function ElectricAwningGoogleAdsLandingPage() {
  return <ElectricAwningAdsLanding source="google-ads" />;
}
