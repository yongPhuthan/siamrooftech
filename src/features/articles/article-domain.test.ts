import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArticleDocument, ArticleDocumentSchema, ArticleMetadata } from './document-schema';
import { articlePath, isSlugReservationAvailable, isValidArticleSlug } from './article-path';
import { buildArticleOutline, collectArticleHeadings } from './heading-outline';
import { buildPublishedSnapshot, validateDraft, validateForPublication } from './publication-policy';
import { renderArticleDocument } from './public/ArticleDocumentView';
import ArticleToc from './public/ArticleToc';

const validMetadata: ArticleMetadata = {
  title: 'การเลือกอุปกรณ์', slug: 'choose-awning-equipment', excerpt: 'ข้อมูลสำหรับเลือกอุปกรณ์ให้เหมาะกับหน้างาน',
  category: 'คำแนะนำ', authorName: 'ทีมช่าง Siamrooftech', authorType: 'Organization', topic: 'การเลือกอุปกรณ์', tags: [],
  seoTitle: 'การเลือกอุปกรณ์กันสาด', seoDescription: 'แนวทางเลือกอุปกรณ์ให้เหมาะกับหน้างาน', sources: [],
};

const heading = (level: 2 | 3, id: string, text: string) => ({
  type: 'heading' as const,
  attrs: { level, id },
  content: [{ type: 'text' as const, text }],
});

const p = (text: string) => ({ type: 'paragraph' as const, content: [{ type: 'text' as const, text }] });

const completeDocument: ArticleDocument = {
  type: 'doc',
  content: [
    heading(2, 'section-11111111-1111-4111-8111-111111111111', 'สำรวจหน้างาน'),
    heading(3, 'section-22222222-2222-4222-8222-222222222222', 'ตรวจผนัง'),
    p('ตรวจวัสดุผนังและจุดยึดให้เหมาะกับน้ำหนัก'),
    heading(2, 'section-33333333-3333-4333-8333-333333333333', 'เลือกอุปกรณ์'),
    p('เทียบสเปกตามข้อมูลผู้ผลิตและความต้องการใช้งาน'),
  ],
};

describe('article document and TOC', () => {
  it('accepts the supplied heading-only outline as a draft without fabricating body text', () => {
    const outline: ArticleDocument = { type: 'doc', content: [heading(2, 'section-11111111-1111-4111-8111-111111111111', 'สำรวจหน้างาน'), heading(3, 'section-22222222-2222-4222-8222-222222222222', 'ตรวจผนัง')] };
    expect(validateDraft(validMetadata, outline)).toEqual([]);
    expect(validateForPublication(validMetadata, outline).map(({ field }) => field)).toContain('document#section-22222222-2222-4222-8222-222222222222');
  });

  it('allows identical heading labels while keeping persistent IDs distinct', () => {
    const repeated: ArticleDocument = { type: 'doc', content: [heading(2, 'section-11111111-1111-4111-8111-111111111111', 'รายละเอียด'), p('เนื้อหาแรก'), heading(2, 'section-22222222-2222-4222-8222-222222222222', 'รายละเอียด'), p('เนื้อหาที่สอง')] };
    expect(ArticleDocumentSchema.safeParse(repeated).success).toBe(true);
    expect(collectArticleHeadings(repeated).map(({ id }) => id)).toEqual(['section-11111111-1111-4111-8111-111111111111', 'section-22222222-2222-4222-8222-222222222222']);
  });

  it('rejects duplicate IDs and unsafe URL protocols in nodes', () => {
    const duplicateIds: ArticleDocument = { type: 'doc', content: [heading(2, 'section-11111111-1111-4111-8111-111111111111', 'หนึ่ง'), heading(2, 'section-11111111-1111-4111-8111-111111111111', 'สอง')] };
    expect(ArticleDocumentSchema.safeParse(duplicateIds).success).toBe(false);
    const unsafeLink: ArticleDocument = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'คลิก', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] };
    expect(ArticleDocumentSchema.safeParse(unsafeLink).success).toBe(false);
    const unsafeImage: ArticleDocument = { type: 'doc', content: [{ type: 'image', attrs: { src: 'data:image/svg+xml,unsafe', alt: '', decorative: true } }] };
    expect(ArticleDocumentSchema.safeParse(unsafeImage).success).toBe(false);
  });

  it('creates the same stable heading anchors in rendered HTML and TOC links', () => {
    const parsed = ArticleDocumentSchema.parse(completeDocument);
    const rendered = renderArticleDocument(parsed);
    const toc = renderToStaticMarkup(ArticleToc({ headings: collectArticleHeadings(parsed) }));
    const ids = collectArticleHeadings(parsed).map(({ id }) => id);
    for (const id of ids) {
      expect(rendered).toContain(`id="${id}"`);
      expect(toc).toContain(`href="#${id}"`);
    }
    expect(buildArticleOutline(collectArticleHeadings(parsed))[0].children).toHaveLength(1);
  });

  it('validates and renders supported table-cell alignment from pasted content', () => {
    const table: ArticleDocument = {
      type: 'doc',
      content: [{ type: 'table', content: [{ type: 'tableRow', content: [
        { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1, colwidth: null, align: 'center' }, content: [p('ช่วงเวลา')] },
        { type: 'tableCell', attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null }, content: [p('ทันที')] },
      ] }] }],
    };
    const parsed = ArticleDocumentSchema.parse(table);
    expect(renderArticleDocument(parsed)).toContain('<th scope="col" style="text-align: center">');
    expect(renderArticleDocument(parsed)).toContain('<td>');
  });

  it('treats empty H2 groups as complete when their child sections contain content', () => {
    const grouped: ArticleDocument = { type: 'doc', content: [heading(2, 'section-11111111-1111-4111-8111-111111111111', 'กลุ่ม'), heading(3, 'section-22222222-2222-4222-8222-222222222222', 'ส่วนย่อย'), p('มีคำตอบในส่วนย่อย')] };
    expect(collectArticleHeadings(grouped).map(({ incomplete }) => incomplete)).toEqual([false, false]);
  });
});

describe('article routes and publication snapshots', () => {
  it('requires a stored lowercase English slug and never creates one from a title', () => {
    expect(isValidArticleSlug('choose-awning-equipment')).toBe(true);
    expect(isValidArticleSlug('ชื่อภาษาไทย')).toBe(false);
    expect(isValidArticleSlug('Choose-Awning')).toBe(false);
    expect(isValidArticleSlug('id_123')).toBe(false);
    expect(articlePath('choose-awning-equipment')).toBe('/articles/choose-awning-equipment');
    expect(() => articlePath('')).toThrow();
    expect(isSlugReservationAvailable('choose-awning-equipment', 'article-a')).toBe(true);
    expect(isSlugReservationAvailable('choose-awning-equipment', 'article-b', 'article-a')).toBe(false);
    expect(isSlugReservationAvailable('choose-awning-equipment', 'article-a', 'article-a')).toBe(true);
  });

  it('retains published dates when unchanged and updates modification time when content changes', () => {
    const first = buildPublishedSnapshot('article-1', 2, validMetadata, completeDocument, '2026-10-06T00:00:00.000Z');
    const unchanged = buildPublishedSnapshot('article-1', 3, validMetadata, completeDocument, '2026-10-07T00:00:00.000Z', first);
    expect(unchanged.publishedAt).toBe(first.publishedAt);
    expect(unchanged.modifiedAt).toBe(first.modifiedAt);
    const revisedMetadata = { ...validMetadata, excerpt: 'อัปเดตคำโปรยตามเนื้อหาจริง' };
    const changed = buildPublishedSnapshot('article-1', 4, revisedMetadata, completeDocument, '2026-10-08T00:00:00.000Z', unchanged);
    expect(changed.publishedAt).toBe(first.publishedAt);
    expect(changed.modifiedAt).toBe('2026-10-08T00:00:00.000Z');
  });
});
