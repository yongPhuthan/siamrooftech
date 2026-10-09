import { z } from 'zod';

const MAX_DOCUMENT_BYTES = 900_000;
const MAX_NODES = 10_000;
const MAX_DEPTH = 30;

const SafeUrlSchema = z.string().max(2_048).refine((value) => {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}, 'URL must use http, https, mailto, or a same-site path');
const SafeMediaUrlSchema = z.string().max(2_048).refine((value) => {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol);
  } catch {
    return false;
  }
}, 'Media URL must use http, https, or a same-site path');
const PublicWebUrlSchema = z.string().max(2_048).url().refine((value) => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}, 'URL must use http or https');

const MarkSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }).strict(),
  z.object({ type: z.literal('italic') }).strict(),
  z.object({ type: z.literal('strike') }).strict(),
  z.object({ type: z.literal('code') }).strict(),
  z.object({ type: z.literal('link'), attrs: z.object({ href: SafeUrlSchema, target: z.enum(['_self', '_blank']).nullable().optional(), rel: z.string().max(200).nullable().optional(), class: z.string().max(200).nullable().optional() }).strict() }).strict(),
]);

export type ArticleMark = z.infer<typeof MarkSchema>;
export type TextNode = { type: 'text'; text: string; marks?: ArticleMark[] };
export type HeadingNode = { type: 'heading'; attrs: { level: 2 | 3; id: string }; content?: ArticleNode[] };
export type ImageNode = {
  type: 'image';
  attrs: { src: string; alt: string | null; title?: string | null; width?: number | null; height?: number | null; decorative?: boolean; caption?: string | null };
};
export type ArticleNode = TextNode | HeadingNode | ImageNode | {
  type: 'doc' | 'paragraph' | 'bulletList' | 'orderedList' | 'listItem' | 'table' | 'tableRow' | 'tableCell' | 'tableHeader' | 'blockquote';
  content?: ArticleNode[];
  attrs?: { start?: number | null; type?: string | null; colspan?: number; rowspan?: number; colwidth?: number[] | null; align?: 'left' | 'center' | 'right' | null };
};

const TableCellAttrsSchema = z.object({
  colspan: z.number().int().positive().optional(),
  rowspan: z.number().int().positive().optional(),
  colwidth: z.array(z.number().positive()).nullable().optional(),
  align: z.enum(['left', 'center', 'right']).nullable().optional(),
}).strict();

const NodeSchema: z.ZodType<ArticleNode> = z.lazy(() => z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string().max(100_000), marks: z.array(MarkSchema).max(8).optional() }).strict(),
  z.object({ type: z.literal('doc'), content: z.array(NodeSchema).max(MAX_NODES) }).strict(),
  z.object({ type: z.literal('paragraph'), content: z.array(NodeSchema).max(MAX_NODES).optional() }).strict(),
  z.object({ type: z.literal('heading'), attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]), id: z.string().regex(/^section-[a-zA-Z0-9-]{8,80}$/) }).strict(), content: z.array(NodeSchema).max(500).optional() }).strict(),
  z.object({ type: z.literal('bulletList'), content: z.array(NodeSchema).max(MAX_NODES) }).strict(),
  z.object({ type: z.literal('orderedList'), attrs: z.object({ start: z.number().int().positive().nullable().optional(), type: z.string().nullable().optional() }).strict().optional(), content: z.array(NodeSchema).max(MAX_NODES) }).strict(),
  z.object({ type: z.literal('listItem'), content: z.array(NodeSchema).max(MAX_NODES) }).strict(),
  z.object({ type: z.literal('table'), content: z.array(NodeSchema).max(1_000) }).strict(),
  z.object({ type: z.literal('tableRow'), content: z.array(NodeSchema).max(100) }).strict(),
  z.object({ type: z.literal('tableCell'), attrs: TableCellAttrsSchema.optional(), content: z.array(NodeSchema).max(100) }).strict(),
  z.object({ type: z.literal('tableHeader'), attrs: TableCellAttrsSchema.optional(), content: z.array(NodeSchema).max(100) }).strict(),
  z.object({ type: z.literal('blockquote'), content: z.array(NodeSchema).max(500) }).strict(),
  z.object({ type: z.literal('image'), attrs: z.object({ src: SafeMediaUrlSchema, alt: z.string().max(500).nullable(), title: z.string().max(500).nullable().optional(), width: z.number().int().positive().max(10_000).nullable().optional(), height: z.number().int().positive().max(10_000).nullable().optional(), decorative: z.boolean().optional(), caption: z.string().max(1_000).nullable().optional() }).strict() }).strict(),
]) as z.ZodType<ArticleNode>);

export const ArticleDocumentSchema = z.object({ type: z.literal('doc'), content: z.array(NodeSchema).max(MAX_NODES) }).strict().superRefine((document, context) => {
  const ids = new Set<string>();
  let count = 0;
  const allowedChildren: Record<string, string[]> = {
    doc: ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'table', 'image'],
    paragraph: ['text'], heading: ['text'],
    bulletList: ['listItem'], orderedList: ['listItem'],
    listItem: ['paragraph', 'bulletList', 'orderedList', 'image'],
    blockquote: ['paragraph', 'bulletList', 'orderedList'],
    table: ['tableRow'], tableRow: ['tableCell', 'tableHeader'],
    tableCell: ['paragraph', 'bulletList', 'orderedList'], tableHeader: ['paragraph', 'bulletList', 'orderedList'],
  };
  const visit = (node: ArticleNode, depth: number, parentType: string) => {
    count += 1;
    if (depth > MAX_DEPTH) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Document nesting is too deep' });
    if (count > MAX_NODES) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Document contains too many nodes' });
    if (!allowedChildren[parentType]?.includes(node.type)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Unsupported ${node.type} node inside ${parentType}` });
    if (node.type === 'heading') {
      if (ids.has(node.attrs.id)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate heading id: ${node.attrs.id}` });
      ids.add(node.attrs.id);
    }
    if ('content' in node && node.content) node.content.forEach((child) => visit(child, depth + 1, node.type));
  };
  document.content.forEach((node) => visit(node, 1, 'doc'));
  if (new TextEncoder().encode(JSON.stringify(document)).byteLength > MAX_DOCUMENT_BYTES) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Document exceeds the supported storage size' });
  }
});

export type ArticleDocument = z.infer<typeof ArticleDocumentSchema>;

export const ArticleMetadataSchema = z.object({
  title: z.string().max(300),
  slug: z.string().max(120),
  excerpt: z.string().max(600),
  category: z.string().max(100),
  authorName: z.string().max(160),
  authorType: z.enum(['Person', 'Organization']).optional(),
  authorUrl: PublicWebUrlSchema.optional(),
  reviewerName: z.string().max(160).optional(),
  reviewerType: z.enum(['Person', 'Organization']).optional(),
  reviewerUrl: PublicWebUrlSchema.optional(),
  topic: z.string().max(200),
  intent: z.enum(['informational', 'commercial', 'transactional', 'mixed']).optional(),
  tags: z.array(z.string().max(60)).max(20),
  seoTitle: z.string().max(300),
  seoDescription: z.string().max(600),
  coverImage: SafeMediaUrlSchema.optional(),
  coverAlt: z.string().max(500).optional(),
  sources: z.array(z.object({ label: z.string().trim().min(1).max(200), url: PublicWebUrlSchema }).strict()).max(50),
}).strict();

export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;

function normalizeTerms(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map((value) => value.normalize('NFC').trim()).filter((value) => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const ArticleSeoSettingsSchema = z.object({
  primaryKeyword: z.string().max(120).optional().transform((value) => value?.normalize('NFC').trim() || undefined),
  secondaryKeywords: z.array(z.string().max(120)).max(20).transform(normalizeTerms),
  primaryAliases: z.array(z.string().max(120)).max(20).transform(normalizeTerms),
}).strict();

export type ArticleSeoSettings = z.infer<typeof ArticleSeoSettingsSchema>;

export const emptyArticleSeoSettings: ArticleSeoSettings = {
  primaryKeyword: undefined,
  secondaryKeywords: [],
  primaryAliases: [],
};

export function resolveArticleSeoSettings(input: unknown, existing?: ArticleSeoSettings): ArticleSeoSettings {
  return ArticleSeoSettingsSchema.parse(input ?? existing ?? emptyArticleSeoSettings);
}

export const ArticleDraftInputSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  metadata: ArticleMetadataSchema,
  document: ArticleDocumentSchema,
  seoSettings: ArticleSeoSettingsSchema.optional(),
}).strict();
