import type { Metadata } from 'next';
import { ElectricAwningAdsLanding, electricAwningAdsMetadata } from '@/app/components/google-ads/ElectricAwningAdsLanding';

export const dynamic = 'force-static';

// Same content as the Google Ads page; separate URL and measurement namespace
// so ChatGPT Ads traffic never mixes with Google Ads positions or lead paths.
export const metadata: Metadata = electricAwningAdsMetadata;

export default function ElectricAwningChatGPTAdsLandingPage() {
  return <ElectricAwningAdsLanding source="chatgpt-ads" />;
}
