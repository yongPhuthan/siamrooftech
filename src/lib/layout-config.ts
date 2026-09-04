/**
 * Single source of truth for how the shared layout (Navigation, Footer)
 * behaves per route.
 *
 * Ad landing pages under /lp/ share the same chrome as the rest of the site but
 * hide the nav links, so a visitor arriving from a paid click has no cheap exit
 * away from the single conversion path.
 */

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
