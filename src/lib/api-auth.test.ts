import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/features/auth/server/auth', () => ({
  getAuth: async () => ({ api: { getSession } }),
}));

import { verifyAdminRequest, verifyAdminMutationRequest } from './api-auth';

describe('administrative API authorization', () => {
  beforeEach(() => { getSession.mockReset(); });

  function request({
    cookie,
    authorization,
    method = 'GET',
    origin,
  }: {
    cookie?: string;
    authorization?: string;
    method?: string;
    origin?: string;
  } = {}) {
    const headers = new Headers();
    if (cookie) headers.set('cookie', cookie);
    if (authorization) headers.set('authorization', authorization);
    if (origin) headers.set('origin', origin);
    headers.set('host', 'example.test');
    return new Request('https://example.test/api/admin/articles', { method, headers });
  }

  it('denies missing sessions, ordinary accounts and bearer-only requests', async () => {
    getSession.mockResolvedValue(null);
    expect(await verifyAdminRequest(request())).toBeNull();
    getSession.mockResolvedValue({ user: { id: 'reader', role: 'user' } });
    expect(await verifyAdminRequest(request({ cookie: 'session=opaque' }))).toBeNull();
    expect(await verifyAdminRequest(request({ authorization: 'Bearer old-token' }))).toBeNull();
    expect(getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

  it('accepts only a validated session whose persisted role is admin', async () => {
    const user = { id: 'admin-1', email: 'editor@example.test', role: 'admin' };
    getSession.mockResolvedValue({ user, session: { id: 'session-1' } });
    expect(await verifyAdminRequest(request({ cookie: 'session=opaque' }))).toEqual(user);
  });

  it('fails closed when the session store is unavailable', async () => {
    getSession.mockRejectedValue(new Error('D1 unavailable'));
    expect(await verifyAdminRequest(request({ cookie: 'session=opaque' }))).toBeNull();
  });

  it('requires a same-origin for mutating authenticated requests', async () => {
    getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    expect(await verifyAdminMutationRequest(request({ method: 'POST', cookie: 'session=opaque', origin: 'https://evil.example' }))).toBeNull();
    expect(await verifyAdminMutationRequest(request({ method: 'POST', cookie: 'session=opaque', origin: 'https://example.test' }))).toMatchObject({ id: 'admin-1' });
    expect(await verifyAdminMutationRequest(request({ method: 'POST', cookie: 'session=opaque' }))).toBeNull();
  });
});
