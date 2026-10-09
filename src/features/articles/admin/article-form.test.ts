// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import type { ArticleDocument, ArticleMetadata } from '../document-schema';
import type { ArticleRecordV1 } from '../publication-policy';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/admin-fetch', () => ({ adminFetch }));
// Only replace the external rich-text engine; exercise the real form state/actions.
vi.mock('next/dynamic', () => ({ default: () => ({ document, onChange }: { document: ArticleDocument; onChange: (value: ArticleDocument) => void }) => createElement('button', { onClick: () => onChange({ ...document, content: [...document.content, { type: 'paragraph', content: [{ type: 'text', text: 'เนื้อหาใหม่ที่ยังไม่บันทึก' }] }] }) }, 'แก้ไขเนื้อหา fixture') }));
import ArticleForm from '@/components/admin/ArticleForm';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
afterEach(async () => { await act(async () => { root?.unmount(); }); container?.remove(); adminFetch.mockReset(); });

it('requires saving changed content before publish and sends the saved revision', async () => {
  const metadata: ArticleMetadata = { title: 'ทดสอบ', slug: 'test-article', excerpt: 'คำโปรย', category: 'คำแนะนำ', authorName: 'ทีม', authorType: 'Organization', topic: 'หัวข้อ', tags: [], seoTitle: 'ทดสอบ', seoDescription: 'คำอธิบาย', sources: [] };
  const document: ArticleDocument = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ฉบับที่บันทึก' }] }] };
  const article: ArticleRecordV1 = { id: 'article-1', schemaVersion: 1, revision: 3, draft: { metadata, document, seoSettings: { secondaryKeywords: [], primaryAliases: [] }, updatedAt: '2026-10-06T00:00:00Z' } };
  container = globalThis.document.createElement('div');
  globalThis.document.body.append(container);
  root = createRoot(container);
  const onBack = vi.fn();
  await act(async () => { root.render(createElement(ArticleForm, { article, onBack })); });
  const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>('button')].find(element => element.textContent === label)!;
  expect(container.querySelector('[role="status"]')?.textContent).toBe('บันทึกแล้ว · revision 3');
  expect(button('เผยแพร่').disabled).toBe(false);
  await act(async () => { button('แก้ไขเนื้อหา fixture').click(); });
  expect(button('เผยแพร่').disabled).toBe(true);
  await act(async () => { button('เผยแพร่').click(); });
  expect(adminFetch).not.toHaveBeenCalled();

  adminFetch.mockImplementation(async (_url: string, init: RequestInit) => {
    const savedInput = JSON.parse(init.body as string);
    return new Response(JSON.stringify({ ...article, revision: 4, draft: { ...article.draft, metadata: savedInput.metadata, document: savedInput.document } }));
  });
  await act(async () => { button('บันทึกร่าง').click(); });
  expect(button('เผยแพร่').disabled).toBe(false);
  expect(JSON.parse(adminFetch.mock.calls[0][1].body)).toMatchObject({ document: { content: expect.any(Array) }, seoSettings: { secondaryKeywords: [], primaryAliases: [] } });
  adminFetch.mockResolvedValue(new Response(JSON.stringify({ ...article, revision: 5, published: { metadata }, draft: { ...article.draft } })));
  await act(async () => { button('เผยแพร่').click(); });
  expect(adminFetch.mock.calls[1][0]).toBe('/api/admin/articles/article-1/publish');
  expect(JSON.parse(adminFetch.mock.calls[1][1].body)).toEqual({ expectedRevision: 4 });
});

it('starts a new blank draft clean and exposes the back action without saving it', async () => {
  const onBack = vi.fn();
  container = globalThis.document.createElement('div');
  globalThis.document.body.append(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(ArticleForm, { onBack })); });
  expect(container.querySelector('[role="status"]')?.textContent).toBe('ยังไม่บันทึก');
  const backButton = [...container.querySelectorAll<HTMLButtonElement>('button')].find(element => element.getAttribute('aria-label') === 'กลับรายการบทความ');
  expect(backButton).toBeTruthy();
  await act(async () => { backButton?.click(); });
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(adminFetch).not.toHaveBeenCalled();
});
