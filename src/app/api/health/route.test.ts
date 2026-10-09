import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCloudflareContext } = vi.hoisted(() => ({ getCloudflareContext: vi.fn() }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext }));

import { GET } from './route';

function binding(first: ReturnType<typeof vi.fn>) {
  return { prepare: vi.fn(() => ({ first })) };
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.stubEnv('DEPLOY_ENV', 'staging');
    vi.stubEnv('SITE_ORIGIN', 'https://staging.siamrooftech.com');
    vi.stubEnv('INDEX_POLICY', 'noindex');
    vi.stubEnv('RELEASE_SHA', 'a'.repeat(40));
    getCloudflareContext.mockReset();
  });

  it('reports the target release only after checking matching runtime identity and required schemas', async () => {
    const appDb = binding(vi.fn().mockResolvedValue({ ready: 1 }));
    const cacheDb = binding(vi.fn().mockResolvedValue({ ready: 1 }));
    getCloudflareContext.mockReturnValue({ env: {
      DEPLOY_ENV: 'staging',
      SITE_ORIGIN: 'https://staging.siamrooftech.com',
      INDEX_POLICY: 'noindex',
      APP_DB: appDb,
      NEXT_TAG_CACHE_D1: cacheDb,
    } });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(await response.json()).toEqual({ status: 'ok', releaseSha: 'a'.repeat(40) });
    expect(appDb.prepare).toHaveBeenNthCalledWith(2, expect.stringContaining('published_content'));
    expect(cacheDb.prepare).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns a non-cacheable 503 when the database or target identity is not ready without leaking details', async () => {
    getCloudflareContext.mockReturnValue({ env: {
      DEPLOY_ENV: 'production',
      SITE_ORIGIN: 'https://www.siamrooftech.com',
      INDEX_POLICY: 'index',
      APP_DB: binding(vi.fn()),
      NEXT_TAG_CACHE_D1: binding(vi.fn()),
    } });

    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(await response.json()).toEqual({ status: 'unavailable', releaseSha: 'a'.repeat(40) });
  });
});
