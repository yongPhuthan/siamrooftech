import { describe, expect, it } from 'vitest';
import { analyzeArticleOnPage } from './on-page-analysis';
import type { ArticleDocument, ArticleMetadata, ArticleSeoSettings } from '../document-schema';

const metadata: ArticleMetadata = {
  title: 'คู่มือกันสาดไฟฟ้า', slug: 'electric-awning', excerpt: 'ข้อมูลกันสาดไฟฟ้า', category: 'สินค้า', authorName: 'ทีมงาน', topic: 'กันสาด', tags: [],
  seoTitle: 'กันสาดไฟฟ้า เลือกอย่างไร', seoDescription: 'คำแนะนำกันสาดไฟฟ้าสำหรับบ้าน', sources: [],
};
const seoSettings: ArticleSeoSettings = { primaryKeyword: 'กันสาดไฟฟ้า', secondaryKeywords: ['กันสาดพับได้'], primaryAliases: [] };
const heading = { type: 'heading' as const, attrs: { level: 2 as const, id: 'section-heading-0001' }, content: [{ type: 'text' as const, text: 'เลือกกันสาดไฟฟ้า' }] };

function analyze(content: ArticleDocument['content'], wordSegmenter?: Intl.Segmenter | null) {
  return analyzeArticleOnPage({ metadata, document: { type: 'doc', content }, seoSettings, ...(wordSegmenter === undefined ? {} : { wordSegmenter }) });
}

describe('analyzeArticleOnPage', () => {
  it('matches Thai phrases with or without spaces and returns an original editor range across marks', () => {
    const joined = analyze([{ type: 'paragraph', content: [{ type: 'text', text: 'กันสาด', marks: [{ type: 'bold' }] }, { type: 'text', text: 'ไฟฟ้าเหมาะกับบ้าน' }] }]);
    const spaced = analyze([{ type: 'paragraph', content: [{ type: 'text', text: 'กันสาดไฟฟ้า เหมาะกับบ้าน' }] }]);
    const keyword = (result: ReturnType<typeof analyze>) => result.keywords.find((item) => item.phrase === 'กันสาดไฟฟ้า')!;
    expect(keyword(joined).occurrences).toBe(keyword(spaced).occurrences);
    expect(keyword(joined).occurrences).toBe(1);
    expect(keyword(joined).matches[0].target).toEqual({ kind: 'text', from: 1, to: 12 });
    expect(joined.wordCount).toBeGreaterThan(0);
    expect(joined.ruleset).toBe('on-page-local-v1');
  });

  it('does not count a short substring inside a longer Thai word or match across text blocks', () => {
    const shortKeyword: ArticleSeoSettings = { ...seoSettings, primaryKeyword: 'ไฟ', secondaryKeywords: [], primaryAliases: [] };
    const splitAcrossBlocks: ArticleDocument = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'กันสาด' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'ไฟฟ้า' }] }] };
    const split = analyze(splitAcrossBlocks.content);
    expect(analyzeArticleOnPage({ metadata, document: withinWordDocument(), seoSettings: shortKeyword }).keywords[0].occurrences).toBe(0);
    expect(split.keywords[0].occurrences).toBe(0);
  });

  it('normalizes Unicode for matching but keeps offsets in the original editor text', () => {
    const document: ArticleDocument = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'cafe\u0301 โต๊ะ' }] }] };
    const result = analyzeArticleOnPage({ metadata, document, seoSettings: { primaryKeyword: 'café', secondaryKeywords: [], primaryAliases: [] } });
    expect(result.keywords[0].occurrences).toBe(1);
    expect(result.keywords[0].matches[0].target).toEqual({ kind: 'text', from: 1, to: 6 });
  });

  it('accepts an empty alt on a decorative image', () => {
    const result = analyze([{ type: 'paragraph', content: [{ type: 'text', text: 'ข้อความ' }] }, { type: 'image', attrs: { src: '/media/decorative.png', alt: '', decorative: true, width: 400, height: 200 } }]);
    expect(result.images.concerns.some((finding) => finding.id === 'image-alt-0')).toBe(false);
  });

  it('counts heading and body text while excluding metadata, URLs, and image alt text', () => {
    const result = analyze([
      heading,
      { type: 'paragraph', content: [{ type: 'text', text: 'กันสาดไฟฟ้า' }] },
      { type: 'image', attrs: { src: '/media/กันสาดไฟฟ้า.jpg', alt: 'กันสาดไฟฟ้า', width: null, height: null } },
    ]);
    expect(result.keywords[0].occurrences).toBe(2);
    expect(result.images.total).toBe(1);
    expect(result.images.concerns.map((finding) => finding.id)).toContain('image-dimensions-0');
  });

  it('keeps structural findings available when Thai word segmentation is missing', () => {
    const result = analyze([heading], null);
    expect(result.wordCount).toBeNull();
    expect(result.wordCountMethod).toBeNull();
    expect(result.findings.some((finding) => finding.id === 'keyword-segmentation-unavailable')).toBe(true);
    expect(result.headings).toHaveLength(1);
  });

  it('classifies links and flags empty or overly generic anchors', () => {
    const result = analyze([{ type: 'paragraph', content: [
      { type: 'text', text: 'อ่านเพิ่มเติม', marks: [{ type: 'link', attrs: { href: '/articles/other' } }] },
      { type: 'text', text: 'เว็บ', marks: [{ type: 'link', attrs: { href: 'https://example.org' } }] },
      { type: 'text', text: 'ติดต่อ', marks: [{ type: 'link', attrs: { href: 'mailto:team@example.org' } }] },
      { type: 'text', text: '', marks: [{ type: 'link', attrs: { href: '#details' } }] },
    ] }]);
    expect(result.links.internal).toBe(1);
    expect(result.links.external).toBe(1);
    expect(result.links.contact).toBe(1);
    expect(result.links.fragment).toBe(1);
    expect(result.links.concerns.some((finding) => finding.title.includes('ข้อความลิงก์'))).toBe(true);
  });
});

function withinWordDocument(): ArticleDocument {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ไฟฟ้า' }] }] };
}
