import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { verifyAdminRequest, getAdminArticle, unpublishArticle, revalidatePath, revalidateTag } = vi.hoisted(() => ({ verifyAdminRequest: vi.fn(), getAdminArticle: vi.fn(), unpublishArticle: vi.fn(), revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ verifyAdminRequest, unauthorizedResponse: () => new Response(null, { status: 401 }) }));
vi.mock('@/features/articles/server/repository', () => ({ getAdminArticle, unpublishArticle }));
vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }));
import { POST } from '@/app/api/admin/articles/[id]/unpublish/route';

beforeEach(() => {
  vi.clearAllMocks();
  verifyAdminRequest.mockResolvedValue({ uid: 'admin', admin: true });
  getAdminArticle.mockResolvedValue({ published: { metadata: { slug: 'example-article' } } });
  unpublishArticle.mockResolvedValue({ id: 'article-1', revision: 5 });
});

it('invalidates the sitemap and public content after explicit unpublication', async () => {
  const request = new NextRequest('http://localhost/api/admin/articles/article-1/unpublish', { method: 'POST', body: JSON.stringify({ expectedRevision: 4 }) });
  const response = await POST(request, { params: Promise.resolve({ id: 'article-1' }) });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ revision: 5 });
  expect(unpublishArticle).toHaveBeenCalledWith('article-1', 4);
  expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  expect(revalidatePath).toHaveBeenCalledWith('/articles');
  expect(revalidatePath).toHaveBeenCalledWith('/articles/example-article');
});

it('does not mutate publication state or caches without administrative authorization', async () => {
  verifyAdminRequest.mockResolvedValue(null);
  const response = await POST(new NextRequest('http://localhost/api/admin/articles/article-1/unpublish', { method: 'POST' }), { params: Promise.resolve({ id: 'article-1' }) });
  expect(response.status).toBe(401);
  expect(getAdminArticle).not.toHaveBeenCalled();
  expect(unpublishArticle).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});
