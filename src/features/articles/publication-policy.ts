import { ArticleMetadata, ArticleMetadataSchema, ArticleDocument, ArticleDocumentSchema, ArticleNode, ArticleSeoSettings } from './document-schema';
import { collectArticleHeadings } from './heading-outline';
import { isValidArticleSlug } from './article-path';

const DRAFT_MARKER = /\[\[[^\]]*\]\]/;

function collectDraftMarkerFields(document: ArticleDocument): string[] {
  const fields = new Set<string>();
  let activeHeadingId: string | undefined;

  const visit = (node: ArticleNode, headingId?: string) => {
    const ownerId = node.type === 'heading' ? node.attrs.id : headingId;
    if (node.type === 'text' && DRAFT_MARKER.test(node.text)) {
      fields.add(ownerId ? `document#${ownerId}` : 'document');
    } else if (node.type === 'image') {
      const attrs = [node.attrs.alt, node.attrs.title, node.attrs.caption];
      if (attrs.some((value) => typeof value === 'string' && DRAFT_MARKER.test(value))) {
        fields.add(ownerId ? `document#${ownerId}` : 'document');
      }
    }
    if ('content' in node && node.content) {
      for (const child of node.content) visit(child, ownerId);
    }
  };

  for (const node of document.content) {
    if (node.type === 'heading') activeHeadingId = node.attrs.id;
    visit(node, activeHeadingId);
  }
  return [...fields];
}

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

  const markerMessage = 'ยังมีจุด [[เติม / เลือก / ลบได้]] ค้างอยู่ — แก้ให้ครบก่อนเผยแพร่';
  const metadataFields: [string, string | undefined][] = [
    ['metadata.title', validMetadata.title],
    ['metadata.slug', validMetadata.slug],
    ['metadata.excerpt', validMetadata.excerpt],
    ['metadata.category', validMetadata.category],
    ['metadata.authorName', validMetadata.authorName],
    ['metadata.reviewerName', validMetadata.reviewerName],
    ['metadata.topic', validMetadata.topic],
    ['metadata.seoTitle', validMetadata.seoTitle],
    ['metadata.seoDescription', validMetadata.seoDescription],
    ['metadata.coverAlt', validMetadata.coverAlt],
  ];
  for (const [field, value] of metadataFields) {
    if (value && DRAFT_MARKER.test(value)) problems.push({ field, message: markerMessage });
  }
  if (validMetadata.tags.some((tag) => DRAFT_MARKER.test(tag))) {
    problems.push({ field: 'metadata.tags', message: markerMessage });
  }
  if (validMetadata.sources.some((source) => DRAFT_MARKER.test(source.label))) {
    problems.push({ field: 'metadata.sources', message: markerMessage });
  }
  for (const field of collectDraftMarkerFields(validDocument)) {
    problems.push({ field, message: markerMessage });
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
