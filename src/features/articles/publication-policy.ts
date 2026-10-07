import { ArticleMetadata, ArticleMetadataSchema, ArticleDocument, ArticleDocumentSchema, ArticleSeoSettings } from './document-schema';
import { collectArticleHeadings } from './heading-outline';
import { isValidArticleSlug } from './article-path';

export interface ArticleSnapshot {
  schemaVersion: 1;
  articleId: string;
  revision: number;
  metadata: ArticleMetadata;
  document: ArticleDocument;
  publishedAt: string;
  modifiedAt: string;
}

export interface ArticleDraft {
  metadata: ArticleMetadata;
  document: ArticleDocument;
  seoSettings: ArticleSeoSettings;
  updatedAt: string;
}

export interface ArticleRecordV1 {
  schemaVersion: 1;
  id: string;
  revision: number;
  draft: ArticleDraft;
  published?: ArticleSnapshot;
}

export interface PublicationProblem {
  field: string;
  message: string;
}

export function validateDraft(metadata: unknown, document: unknown): PublicationProblem[] {
  const problems: PublicationProblem[] = [];
  const metadataResult = ArticleMetadataSchema.safeParse(metadata);
  if (!metadataResult.success) problems.push(...metadataResult.error.issues.map((issue) => ({ field: `metadata.${issue.path.join('.')}`, message: issue.message })));
  const documentResult = ArticleDocumentSchema.safeParse(document);
  if (!documentResult.success) problems.push(...documentResult.error.issues.map((issue) => ({ field: `document.${issue.path.join('.')}`, message: issue.message })));
  return problems;
}

export function validateForPublication(metadata: unknown, document: unknown): PublicationProblem[] {
  const problems = validateDraft(metadata, document);
  if (problems.length) return problems;
  const validMetadata = ArticleMetadataSchema.parse(metadata);
  const validDocument = ArticleDocumentSchema.parse(document);
  if (!validMetadata.title.trim()) problems.push({ field: 'metadata.title', message: 'กรุณาระบุชื่อบทความ' });
  if (!isValidArticleSlug(validMetadata.slug)) problems.push({ field: 'metadata.slug', message: 'URL ต้องเป็นภาษาอังกฤษ ตัวพิมพ์เล็ก และใช้ขีดคั่นคำ' });
  if (!validMetadata.excerpt.trim()) problems.push({ field: 'metadata.excerpt', message: 'กรุณาเขียนคำโปรยที่ตรงกับบทความ' });
  if (!validMetadata.category.trim()) problems.push({ field: 'metadata.category', message: 'กรุณาเลือกหมวดหมู่' });
  if (!validMetadata.authorName.trim()) problems.push({ field: 'metadata.authorName', message: 'กรุณาระบุผู้เขียนจริงหรือองค์กรผู้เผยแพร่' });
  if (!validMetadata.authorType) problems.push({ field: 'metadata.authorType', message: 'ระบุว่าผู้เขียนเป็นบุคคลหรือองค์กร' });
  if (validMetadata.reviewerUrl && !validMetadata.reviewerName?.trim()) problems.push({ field: 'metadata.reviewerName', message: 'ระบุชื่อผู้ตรวจทานก่อนใส่ URL ผู้ตรวจทาน' });
  if (validMetadata.reviewerName?.trim() && !validMetadata.reviewerType) problems.push({ field: 'metadata.reviewerType', message: 'ระบุว่าผู้ตรวจทานเป็นบุคคลหรือองค์กร' });
  if (!validMetadata.topic.trim()) problems.push({ field: 'metadata.topic', message: 'กรุณาระบุหัวข้อหลักของบทความ' });
  if (!validMetadata.seoTitle.trim()) problems.push({ field: 'metadata.seoTitle', message: 'กรุณาระบุ SEO title' });
  if (!validMetadata.seoDescription.trim()) problems.push({ field: 'metadata.seoDescription', message: 'กรุณาระบุ meta description' });
  if (validMetadata.coverImage && !validMetadata.coverAlt?.trim()) problems.push({ field: 'metadata.coverAlt', message: 'เพิ่มคำอธิบายภาพปกหรือเอาภาพปกออกก่อนเผยแพร่' });

  const headings = collectArticleHeadings(validDocument);
  if (!headings.length) problems.push({ field: 'document', message: 'เพิ่มอย่างน้อยหนึ่งหัวข้อ H2 หรือ H3 ก่อนเผยแพร่' });
  let hasSeenH2 = false;
  for (const node of validDocument.content) {
    if (node.type === 'heading' && node.attrs.level === 2) hasSeenH2 = true;
    if (node.type === 'heading' && node.attrs.level === 3 && !hasSeenH2) problems.push({ field: `document#${node.attrs.id}`, message: 'H3 ต้องอยู่ภายใต้หัวข้อ H2' });
    if (node.type === 'image' && !node.attrs.decorative && !node.attrs.alt?.trim()) problems.push({ field: 'document', message: 'เพิ่มคำอธิบายให้ภาพ หรือระบุว่าเป็นภาพตกแต่ง' });
  }
  for (const heading of headings) {
    if (heading.incomplete) problems.push({ field: `document#${heading.id}`, message: `เติมเนื้อหาในส่วน “${heading.text || 'หัวข้อยังไม่มีชื่อ'}” ก่อนเผยแพร่` });
    if (!heading.text) problems.push({ field: `document#${heading.id}`, message: 'หัวข้อที่เผยแพร่ต้องมีชื่อ' });
  }
  return problems;
}

export function buildPublishedSnapshot(
  articleId: string,
  revision: number,
  metadata: ArticleMetadata,
  document: ArticleDocument,
  now: string,
  existing?: ArticleSnapshot,
): ArticleSnapshot {
  const contentChanged = !existing || JSON.stringify({ metadata, document }) !== JSON.stringify({ metadata: existing.metadata, document: existing.document });
  return {
    schemaVersion: 1,
    articleId,
    revision,
    metadata,
    document,
    publishedAt: existing?.publishedAt ?? now,
    modifiedAt: contentChanged ? now : existing?.modifiedAt ?? now,
  };
}
