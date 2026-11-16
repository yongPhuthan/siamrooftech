import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/api-auth', () => ({ verifyAdminRequest: vi.fn(), unauthorizedResponse: () => new Response('{}', { status: 401 }) }));
import { verifyAdminRequest } from '@/lib/api-auth';
import { GET, POST } from './[...path]/route';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
function setup() {
  vi.stubEnv('LINE_CHAT_HISTORY_WORKER_URL', 'http://localhost:8788');
  vi.stubEnv('CHAT_HISTORY_READ_TOKEN', 'fixture-read'); vi.stubEnv('CHAT_HISTORY_WRITE_TOKEN', 'fixture-write');
  vi.mocked(verifyAdminRequest).mockResolvedValue({ id: 'verified-owner' } as any);
}
describe('authenticated CRM proxy', () => {
  it('denies unauthenticated reads without contacting the Worker', async () => {
    vi.mocked(verifyAdminRequest).mockResolvedValue(null);
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const result = await GET(new NextRequest('http://localhost/api/admin/crm/leads'), { params: Promise.resolve({ path: ['leads'] }) });
    expect(result.status).toBe(401); expect(fetch).not.toHaveBeenCalled();
  });
  it('derives actor from the server session and does not forward browser actor headers', async () => {
    setup();
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { headers: { 'content-type': 'application/json' } })); vi.stubGlobal('fetch', fetch);
    await POST(new NextRequest('http://localhost/api/admin/crm/leads/id/review', { method: 'POST', headers: { 'x-crm-actor': 'admin:forged' }, body: '{}' }),
      { params: Promise.resolve({ path: ['leads', 'id', 'review'] }) });
    const headers = fetch.mock.calls[0][1].headers as Headers;
    expect(headers.get('x-crm-actor')).toBe('admin:verified-owner'); expect(headers.get('authorization')).toBe('Bearer fixture-write');
  });
  it('streams downloads with private caching and preserves attachment headers', async () => {
    setup(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ประวัติ\nครบทุกหน้า', {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'content-disposition': 'attachment; filename="history.txt"' },
    })));
    const result = await GET(new NextRequest('http://localhost/api/admin/crm/export'), { params: Promise.resolve({ path: ['export'] }) });
    expect(await result.text()).toBe('ประวัติ\nครบทุกหน้า'); expect(result.headers.get('cache-control')).toContain('no-store');
    expect(result.headers.get('content-disposition')).toContain('attachment');
  });
  it('rejects path traversal and oversized bodies', async () => {
    setup(); const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const traversal = await GET(new NextRequest('http://localhost/api/admin/crm/test'), { params: Promise.resolve({ path: ['..', 'internal'] }) });
    expect(traversal.status).toBe(400);
    const large = await POST(new NextRequest('http://localhost/api/admin/crm/valuations', { method: 'POST', body: JSON.stringify({ text: 'a'.repeat(20000) }) }),
      { params: Promise.resolve({ path: ['valuations'] }) });
    expect(large.status).toBe(400); expect(fetch).not.toHaveBeenCalled();
  });
});
