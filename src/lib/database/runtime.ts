import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface CmsRuntimeEnv {
  APP_DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ADMIN_ALLOWED_EMAILS?: string;
  AUTH_EMAIL?: SendEmail;
  AUTH_EMAIL_FROM?: string;
  AUTH_EMAIL_DELIVERY?: string;
  /** Bound on production only: media is uploaded there and nowhere else. */
  MEDIA_BUCKET?: R2Bucket;
}

export async function getCmsRuntimeEnv(): Promise<CmsRuntimeEnv> {
  // `next build` binds the local (seeded) D1. Reading it would bake local/QA
  // records into prerendered pages and the release cache, so refuse outright.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('CMS data must not be read during next build');
  }
  const { env } = await getCloudflareContext({ async: true });
  if (!env.APP_DB) throw new Error('Local CMS bindings are not configured');
  return env as CmsRuntimeEnv;
}

export async function getMediaBucket(): Promise<R2Bucket> {
  const { MEDIA_BUCKET } = await getCmsRuntimeEnv();
  if (!MEDIA_BUCKET) throw new Error('Media storage is unavailable');
  return MEDIA_BUCKET;
}

export async function getCmsDatabase() {
  const { drizzle } = await import('drizzle-orm/d1');
  const { contentEntries, contentDrafts, contentRoutes, contentPublications, projectSlugSequences, contactSubmissions, contactRateLimits } = await import('./schema');
  const { APP_DB } = await getCmsRuntimeEnv();
  return drizzle(APP_DB, { schema: { contentEntries, contentDrafts, contentRoutes, contentPublications, projectSlugSequences, contactSubmissions, contactRateLimits } });
}
