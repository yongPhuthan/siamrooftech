import { describe, expect, it } from 'vitest';
import type { ArticleDocument, ArticleMetadata } from '../document-schema';
import { buildPublishedSnapshot, validateForPublication } from '../publication-policy';

const metadata: ArticleMetadata = {
  title: 'การเลือกอุปกรณ์', slug: 'choose-equipment', excerpt: 'เลือกอุปกรณ์ตามความต้องการ',
  category: 'คำแนะนำ', authorName: 'ทีมช่าง', authorType: 'Organization', topic: 'อุปกรณ์',
  tags: [], seoTitle: 'การเลือกอุปกรณ์', seoDescription: 'คำแนะนำตามความต้องการใช้งาน', sources: [],
};
const outline: ArticleDocument = {
  type: 'doc', content: [{ type: 'heading', attrs: { level: 2, id: 'section-12345678' }, content: [{ type: 'text', text: 'สเปก' }] }],
};
const complete: ArticleDocument = {
  ...outline,
  content: [...outline.content, { type: 'paragraph', content: [{ type: 'text', text: 'เปรียบเทียบสเปกก่อนเลือกให้เหมาะกับหน้างาน' }] }],
};

describe('article publication policy', () => {
  it('allows a heading-only outline as a draft but rejects it for publication', () => {
    expect(validateForPublication(metadata, outline)).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'document#section-12345678' }),
    ]));
    expect(validateForPublication(metadata, complete)).toEqual([]);
  });

  it('creates a stable snapshot and preserves its first publication date', () => {
    const first = buildPublishedSnapshot('article-1', 1, metadata, complete, '2026-10-06T10:00:00.000Z');
    const sameContent = buildPublishedSnapshot('article-1', 2, metadata, complete, '2026-10-07T10:00:00.000Z', first);
    const changed = buildPublishedSnapshot('article-1', 3, { ...metadata, title: 'ปรับชื่อ' }, complete, '2026-10-08T10:00:00.000Z', first);

    expect(sameContent.publishedAt).toBe(first.publishedAt);
    expect(sameContent.modifiedAt).toBe(first.modifiedAt);
    expect(changed.publishedAt).toBe(first.publishedAt);
    expect(changed.modifiedAt).toBe('2026-10-08T10:00:00.000Z');
  });

  it('requires saved content to satisfy the document contract before publication', () => {
    const unsafe = { ...complete, content: [{ type: 'image', attrs: { src: 'javascript:alert(1)', alt: null } }] } as unknown as ArticleDocument;
    expect(validateForPublication(metadata, unsafe).length).toBeGreaterThan(0);
  });
});
