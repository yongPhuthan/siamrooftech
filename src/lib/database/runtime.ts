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
  MEDIA_BUCKET: R2Bucket;
}

export async function getCmsRuntimeEnv(): Promise<CmsRuntimeEnv> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.APP_DB || !env.MEDIA_BUCKET) throw new Error('Local CMS bindings are not configured');
  return env as CmsRuntimeEnv;
}

export async function getCmsDatabase() {
  const { drizzle } = await import('drizzle-orm/d1');
  const { contentEntries, contentDrafts, contentRoutes, contentPublications, projectSlugSequences, contactSubmissions, contactRateLimits } = await import('./schema');
  const { APP_DB } = await getCmsRuntimeEnv();
  return drizzle(APP_DB, { schema: { contentEntries, contentDrafts, contentRoutes, contentPublications, projectSlugSequences, contactSubmissions, contactRateLimits } });
}
