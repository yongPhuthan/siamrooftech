import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/features/auth/server/auth', () => ({
  getAuth: async () => ({ api: { getSession } }),
}));

import { verifyAdminRequest } from './api-auth';
import { PROJECTS_AGENT, verifyProjectEditorRequest } from './projects-agent-auth';

const TOKEN = 'fixture-projects-agent-token-0123456789abcdef';

function request({ authorization, cookie, method = 'POST', origin }: { authorization?: string; cookie?: string; method?: string; origin?: string } = {}) {
  const headers = new Headers({ host: 'example.test' });
  if (authorization) headers.set('authorization', authorization);
  if (cookie) headers.set('cookie', cookie);
  if (origin) headers.set('origin', origin);
  return new Request('https://example.test/api/projects', { method, headers });
}

describe('project editor authorization', () => {
  beforeEach(() => { getSession.mockReset(); vi.stubEnv('PROJECTS_AGENT_TOKEN', TOKEN); });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('accepts the configured agent token without a browser origin', async () => {
    expect(await verifyProjectEditorRequest(request({ authorization: `Bearer ${TOKEN}` }))).toEqual(PROJECTS_AGENT);
    expect(getSession).not.toHaveBeenCalled();
  });

  it('rejects a wrong token without falling back to the session cookie', async () => {
    getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    expect(await verifyProjectEditorRequest(request({ authorization: `Bearer ${TOKEN}x`, cookie: 'session=opaque', origin: 'https://example.test' }))).toBeNull();
    expect(await verifyProjectEditorRequest(request({ authorization: TOKEN }))).toBeNull();
    expect(getSession).not.toHaveBeenCalled();
  });

  it('stays closed when the token is unset or too short', async () => {
    vi.stubEnv('PROJECTS_AGENT_TOKEN', '');
    expect(await verifyProjectEditorRequest(request({ authorization: 'Bearer ' }))).toBeNull();
    vi.stubEnv('PROJECTS_AGENT_TOKEN', 'short');
    expect(await verifyProjectEditorRequest(request({ authorization: 'Bearer short' }))).toBeNull();
  });

  it('keeps the same-origin admin session path for the console', async () => {
    getSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    expect(await verifyProjectEditorRequest(request({ cookie: 'session=opaque', origin: 'https://example.test' }))).toMatchObject({ id: 'admin-1' });
    expect(await verifyProjectEditorRequest(request({ cookie: 'session=opaque', origin: 'https://evil.example' }))).toBeNull();
  });

  it('does not open other admin APIs to the agent token', async () => {
    getSession.mockResolvedValue(null);
    expect(await verifyAdminRequest(request({ authorization: `Bearer ${TOKEN}`, method: 'GET' }))).toBeNull();
  });
});
