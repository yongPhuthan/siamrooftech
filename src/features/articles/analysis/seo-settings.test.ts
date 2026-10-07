import { describe, expect, it } from 'vitest';
import { ArticleDraftInputSchema, ArticleSeoSettingsSchema, emptyArticleSeoSettings, resolveArticleSeoSettings } from '../document-schema';
import { buildPublishedSnapshot } from '../publication-policy';
import type { ArticleDocument, ArticleMetadata } from '../document-schema';

const metadata: ArticleMetadata = { title: '', slug: '', excerpt: '', category: '', authorName: '', topic: '', tags: [], seoTitle: '', seoDescription: '', sources: [] };
const document: ArticleDocument = { type: 'doc', content: [] };

describe('article SEO draft settings', () => {
  it('normalizes and deduplicates settings while enforcing list limits', () => {
    expect(ArticleSeoSettingsSchema.parse({ primaryKeyword: '  คาเฟ่  ', secondaryKeywords: [' ไฟฟ้า ', 'ไฟฟ้า', 'กันสาด'], primaryAliases: [' Awning ', 'awning'] })).toEqual({ primaryKeyword: 'คาเฟ่', secondaryKeywords: ['ไฟฟ้า', 'กันสาด'], primaryAliases: ['Awning'] });
    expect(ArticleSeoSettingsSchema.safeParse({ primaryKeyword: 'x'.repeat(121), secondaryKeywords: [], primaryAliases: [] }).success).toBe(false);
    expect(ArticleSeoSettingsSchema.safeParse({ primaryKeyword: 'x', secondaryKeywords: Array(21).fill('x'), primaryAliases: [] }).success).toBe(false);
  });

  it('accepts older draft requests that omit settings', () => {
    expect(ArticleDraftInputSchema.parse({ expectedRevision: 0, metadata, document })).not.toHaveProperty('seoSettings');
    const existing = { primaryKeyword: 'คำหลักเดิม', secondaryKeywords: ['รอง'], primaryAliases: ['เรียกอีกแบบ'] };
    expect(resolveArticleSeoSettings(undefined)).toEqual(emptyArticleSeoSettings);
    expect(resolveArticleSeoSettings(undefined, existing)).toEqual(existing);
    expect(resolveArticleSeoSettings({ primaryKeyword: 'คำใหม่', secondaryKeywords: [], primaryAliases: [] }, existing)).toEqual({ primaryKeyword: 'คำใหม่', secondaryKeywords: [], primaryAliases: [] });
  });

  it('does not include editorial SEO settings in published snapshots or modified-content comparison', () => {
    const first = buildPublishedSnapshot('article-1', 1, metadata, document, '2026-10-07T00:00:00Z');
    const same = buildPublishedSnapshot('article-1', 2, metadata, document, '2026-10-08T00:00:00Z', first);
    expect(first).not.toHaveProperty('seoSettings');
    expect(same.modifiedAt).toBe(first.modifiedAt);
    expect(JSON.stringify(same)).not.toContain('primaryKeyword');
  });
});
