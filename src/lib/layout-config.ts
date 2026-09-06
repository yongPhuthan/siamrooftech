/**
 * Single source of truth for how the shared layout (Navigation, Footer, the
 * sticky LINE buttons) behaves per route.
 *
 * Ad landing pages under /lp/ share the same chrome as the rest of the site but
 * hide the nav links, so a visitor arriving from a paid click has no cheap exit
 * away from the single conversion path. They also keep their own analytics
 * position names so paid conversions stay separable from organic traffic in
 * Google Ads reporting.
 */

export type LineCtaPositions = {
  stickyDesktop: string;
  stickyMobile: string;
};

const DEFAULT_POSITIONS: LineCtaPositions = {
  stickyDesktop: 'desktop',
  stickyMobile: 'mobile',
};

/**
 * Routes that need their own conversion-reporting namespace. Keyed by exact
 * pathname because the names are baked into the Google Ads QA contract
 * (scripts/google-ads-qa.mjs) and the conversion mapping sheet.
 */
const AD_LANDING_POSITIONS: Record<string, LineCtaPositions> = {
  '/lp/google-ads/electric-awning': {
    stickyDesktop: 'electric_awning_ads_sticky_desktop',
    stickyMobile: 'electric_awning_ads_sticky_mobile',
  },
};

export function isAdLandingPage(pathname: string | null | undefined): boolean {
  return Boolean(pathname?.startsWith('/lp/'));
}

export function isAdminPage(pathname: string | null | undefined): boolean {
  return Boolean(pathname?.startsWith('/admin'));
}

/** Admin screens opt out of the marketing chrome entirely. */
export function hidesSiteChrome(pathname: string | null | undefined): boolean {
  return isAdminPage(pathname);
}

export function getLineCtaPositions(pathname: string | null | undefined): LineCtaPositions {
  return (pathname && AD_LANDING_POSITIONS[pathname]) || DEFAULT_POSITIONS;
}
