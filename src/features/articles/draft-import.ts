import { createHash } from 'node:crypto';
import {
  ArticleDocument,
  ArticleDocumentSchema,
  ArticleMark,
  ArticleMetadata,
  ArticleMetadataSchema,
  ArticleNode,
  ArticleSeoSettings,
  resolveArticleSeoSettings,
} from './document-schema';
import { PublicationProblem, validateDraft } from './publication-policy';

const DRAFT_MARKER = /\[\[[^\]]*\]\]/g;

export interface CmsDraftConversionOptions {
  category?: string;
  mediaOverrides?: Record<string, string>;
}

export interface ConvertedArticleDraft {
  metadata: ArticleMetadata;
  document: ArticleDocument;
  seoSettings: ArticleSeoSettings;
  markerCount: number;
  warnings: string[];
}

interface ConsoleMediaRef {
  business?: string;
  slotId?: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  source?: string;
}

interface ConsolePerson {
  name?: string;
  kind?: 'Person' | 'Organization';
  url?: string;
}

interface ConsoleBlock {
  type: string;
  id: string;
  text?: string;
  ordered?: boolean;
  items?: string[];
  caption?: string;
  header?: string[];
  rows?: string[][];
  tone?: 'tip' | 'warning' | 'note';
  title?: string;
  project?: string;
  attribution?: string;
  value?: string;
  label?: string;
  href?: string;
  photos?: { id: string; label?: string }[];
}

interface ConsoleSection {
  id: string;
  kind?: 'knowledge' | 'stories';
  heading: string;
  lead?: string;
  blocks?: ConsoleBlock[];
  subsections?: { id: string; heading: string; blocks?: ConsoleBlock[] }[];
}

interface ConsoleArticleInput {
  kind?: string;
  schemaVersion?: number;
  title?: string;
  summary?: string;
  sections?: ConsoleSection[];
  faq?: { id: string; question: string; answer: string }[];
  sources?: { id?: string; title?: string; url?: string }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
  };
  byline?: {
    author?: ConsolePerson | null;
    reviewer?: ConsolePerson | null;
  };
  brief?: {
    focusKeyword?: string;
    secondaryKeywords?: string[];
    intent?: string | null;
  };
  workspace?: {
    media?: Record<string, ConsoleMediaRef>;
  };
  media?: Record<string, ConsoleMediaRef>;
}

function clamp(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function stripHtmlToPlain(html: string): string {
  return decodeHtmlEntities(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function toSectionId(rawId: string, used: Set<string>): string {
  const candidate = /^section-[a-zA-Z0-9-]{8,80}$/.test(rawId)
    ? rawId
    : `section-${createHash('sha256').update(rawId).digest('hex').slice(0, 12)}`;
  let id = candidate;
  let counter = 2;
  while (used.has(id)) {
    id = `${candidate.slice(0, 68)}-${counter}`;
    counter += 1;
  }
  used.add(id);
  return id;
}

function parseInlineRuns(html: string, inheritedMarks: ArticleMark[] = []): ArticleNode[] {
  const nodes: ArticleNode[] = [];
  const tokenRegex = /<\/?(strong|b|em|i|a|br)\b([^>]*)>/gi;
  const stack: ArticleMark[][] = [];
  let currentMarks = [...inheritedMarks];
  let lastIndex = 0;

  const pushText = (raw: string) => {
    const text = decodeHtmlEntities(raw.replace(/<[^>]+>/g, ''));
    if (!text) return;
    nodes.push(currentMarks.length ? { type: 'text', text, marks: [...currentMarks] } : { type: 'text', text });
  };

  for (const match of html.matchAll(tokenRegex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) pushText(html.slice(lastIndex, index));
    lastIndex = index + match[0].length;
    const rawTag = match[0];
    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? '';
    const isClosing = rawTag.startsWith('</');

    if (tag === 'br') {
      pushText('\n');
      continue;
    }
    if (isClosing) {
      currentMarks = stack.pop() ?? [...inheritedMarks];
      continue;
    }
    stack.push([...currentMarks]);
    if (tag === 'strong' || tag === 'b') {
      if (!currentMarks.some((mark) => mark.type === 'bold')) currentMarks = [...currentMarks, { type: 'bold' }];
    } else if (tag === 'em' || tag === 'i') {
      if (!currentMarks.some((mark) => mark.type === 'italic')) currentMarks = [...currentMarks, { type: 'italic' }];
    } else if (tag === 'a') {
      const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
      const href = decodeHtmlEntities(hrefMatch?.[1] ?? hrefMatch?.[2] ?? '').trim();
      if (href) currentMarks = [...currentMarks, { type: 'link', attrs: { href } }];
    }
  }
  if (lastIndex < html.length) pushText(html.slice(lastIndex));
  return nodes;
}

function paragraphFromHtml(html: string): ArticleNode | null {
  const content = parseInlineRuns(html);
  return content.length ? { type: 'paragraph', content } : null;
}

function paragraphFromText(text: string, bold = false): ArticleNode | null {
  const clean = text.trim();
  if (!clean) return null;
  return {
    type: 'paragraph',
    content: [bold ? { type: 'text', text: clean, marks: [{ type: 'bold' }] } : { type: 'text', text: clean }],
  };
}

function parseRichHtmlToBlocks(html: string): ArticleNode[] {
  const trimmed = html.trim();
  if (!trimmed) return [];
  const blocks: ArticleNode[] = [];
  const blockRegex = /<(p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;

  const pushLooseText = (chunk: string) => {
    const clean = chunk.trim();
    if (!clean) return;
    for (const line of clean.split(/\n{2,}/)) {
      const node = paragraphFromHtml(line.trim());
      if (node) blocks.push(node);
    }
  };

  for (const match of trimmed.matchAll(blockRegex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) pushLooseText(trimmed.slice(lastIndex, index));
    lastIndex = index + match[0].length;
    const tag = match[1].toLowerCase();
    const inner = match[2];
    if (tag === 'p') {
      const node = paragraphFromHtml(inner);
      if (node) blocks.push(node);
    } else {
      const items: ArticleNode[] = [];
      for (const liMatch of inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
        const para = paragraphFromHtml(liMatch[1]);
        if (para) items.push({ type: 'listItem', content: [para] });
      }
      if (items.length) {
        blocks.push({ type: tag === 'ol' ? 'orderedList' : 'bulletList', content: items });
      }
    }
  }
  if (lastIndex < trimmed.length) pushLooseText(trimmed.slice(lastIndex));
  return blocks;
}

function resolveMediaNode(
  slotId: string,
  label: string,
  mediaMap: Record<string, ConsoleMediaRef>,
  mediaOverrides: Record<string, string>,
  warnings: string[],
): ArticleNode | null {
  const ref = mediaMap[slotId];
  const overrideUrl = mediaOverrides[slotId] ?? (ref?.slotId ? mediaOverrides[ref.slotId] : undefined);
  const rawUrl = overrideUrl ?? ref?.url;

  if (!rawUrl || rawUrl.startsWith('/__wireframe/')) {
    const fileHint = ref?.slotId?.startsWith('upload:')
      ? `ไฟล์ uploads/${ref.slotId.slice('upload:'.length)}.webp`
      : `ช่อง ${slotId}`;
    warnings.push(`รูป ${slotId} ยังเป็นไฟล์ local ของ console (${fileHint}) — แปลงเป็นช่อง [[เติม: ...]] ในร่างแล้ว`);
    return paragraphFromText(`[[เติม: อัปโหลดรูป${label ? ` “${label}”` : ''} (${fileHint}) แล้วแทรกรูปแทนบรรทัดนี้]]`);
  }

  return {
    type: 'image',
    attrs: {
      src: rawUrl,
      alt: clamp(ref?.alt || label || 'ภาพประกอบงานติดตั้งจริง', 500),
      width: ref?.width ?? null,
      height: ref?.height ?? null,
      caption: label ? clamp(label, 1000) : null,
    },
  };
}

function convertBlock(
  block: ConsoleBlock,
  mediaMap: Record<string, ConsoleMediaRef>,
  mediaOverrides: Record<string, string>,
  usedHeadingIds: Set<string>,
  warnings: string[],
): ArticleNode[] {
  switch (block.type) {
    case 'paragraph':
      return parseRichHtmlToBlocks(block.text ?? '');
    case 'list': {
      const items = (block.items ?? [])
        .map((item) => paragraphFromHtml(item))
        .filter((node): node is ArticleNode => node !== null)
        .map((para): ArticleNode => ({ type: 'listItem', content: [para] }));
      return items.length ? [{ type: block.ordered ? 'orderedList' : 'bulletList', content: items }] : [];
    }
    case 'table': {
      const header = block.header ?? [];
      const rows = block.rows ?? [];
      if (!header.length) return [];
      const tableRows: ArticleNode[] = [
        {
          type: 'tableRow',
          content: header.map((cell) => ({
            type: 'tableHeader',
            content: [paragraphFromText(cell) ?? { type: 'paragraph', content: [{ type: 'text', text: '-' }] }],
          })),
        },
        ...rows.map((row): ArticleNode => ({
          type: 'tableRow',
          content: row.map((cell) => ({
            type: 'tableCell',
            content: [paragraphFromText(cell) ?? { type: 'paragraph', content: [{ type: 'text', text: '-' }] }],
          })),
        })),
      ];
      const nodes: ArticleNode[] = [];
      if (block.caption?.trim()) {
        const cap = paragraphFromText(block.caption, true);
        if (cap) nodes.push(cap);
      }
      nodes.push({ type: 'table', content: tableRows });
      return nodes;
    }
    case 'callout': {
      const toneLabel = block.tone === 'warning' ? 'ข้อควรระวัง' : block.tone === 'note' ? 'หมายเหตุ' : 'เคล็ดลับ';
      const headingLine = block.title?.trim() ? `${toneLabel}: ${block.title.trim()}` : toneLabel;
      const inner: ArticleNode[] = [];
      const titleNode = paragraphFromText(headingLine, true);
      if (titleNode) inner.push(titleNode);
      inner.push(...parseRichHtmlToBlocks(block.text ?? ''));
      return inner.length ? [{ type: 'blockquote', content: inner }] : [];
    }
    case 'quote': {
      const inner: ArticleNode[] = [];
      const textNode = paragraphFromText(block.text ?? '');
      if (textNode) inner.push(textNode);
      if (block.attribution?.trim()) {
        const attrNode = paragraphFromText(`— ${block.attribution.trim()}`);
        if (attrNode) inner.push(attrNode);
      }
      return inner.length ? [{ type: 'blockquote', content: inner }] : [];
    }
    case 'stat': {
      const line = [block.value?.trim(), block.label?.trim()].filter(Boolean).join(' ');
      const node = paragraphFromText(line, true);
      return node ? [node] : [];
    }
    case 'takeaways': {
      const nodes: ArticleNode[] = [];
      const heading = paragraphFromText('สรุปสั้น', true);
      if (heading) nodes.push(heading);
      const items = (block.items ?? [])
        .map((item) => paragraphFromText(item))
        .filter((node): node is ArticleNode => node !== null)
        .map((para): ArticleNode => ({ type: 'listItem', content: [para] }));
      if (items.length) nodes.push({ type: 'bulletList', content: items });
      return nodes;
    }
    case 'softCta': {
      const nodes = parseRichHtmlToBlocks(block.text ?? '');
      if (block.label?.trim() && block.href?.trim()) {
        nodes.push({
          type: 'paragraph',
          content: [{
            type: 'text',
            text: block.label.trim(),
            marks: [{ type: 'bold' }, { type: 'link', attrs: { href: block.href.trim() } }],
          }],
        });
      }
      return nodes;
    }
    case 'image': {
      const node = resolveMediaNode(block.id, block.caption ?? '', mediaMap, mediaOverrides, warnings);
      return node ? [node] : [];
    }
    case 'story': {
      const nodes: ArticleNode[] = [];
      const title = block.title?.trim() || 'ผลงานติดตั้งจริง';
      nodes.push({
        type: 'heading',
        attrs: { level: 3, id: toSectionId(block.id, usedHeadingIds) },
        content: [{ type: 'text', text: title }],
      });
      for (const photo of block.photos ?? []) {
        const imgNode = resolveMediaNode(photo.id, photo.label ?? '', mediaMap, mediaOverrides, warnings);
        if (imgNode) nodes.push(imgNode);
      }
      nodes.push(...parseRichHtmlToBlocks(block.text ?? ''));
      return nodes;
    }
    case 'project':
      if (block.project?.trim()) {
        const node = paragraphFromText(`[[ลบได้: ดูรายละเอียดผลงาน /projects/${block.project.trim()}]]`);
        return node ? [node] : [];
      }
      return [];
    default:
      warnings.push(`ข้าม block ชนิดที่ไม่รองรับ: ${block.type}`);
      return [];
  }
}

function isValidPublicUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function countDraftMarkers(metadata: ArticleMetadata, document: ArticleDocument): number {
  const serialize = `${JSON.stringify(metadata)}\n${JSON.stringify(document)}`;
  return serialize.match(DRAFT_MARKER)?.length ?? 0;
}

export function convertCmsDraftToSiamrooftech(
  rawInput: unknown,
  options: CmsDraftConversionOptions = {},
): { converted?: ConvertedArticleDraft; problems: PublicationProblem[] } {
  if (!rawInput || typeof rawInput !== 'object') {
    return { problems: [{ field: 'input', message: 'ไฟล์ต้นแบบต้องเป็น JSON object' }] };
  }

  const record = rawInput as Record<string, unknown>;
  if ('metadata' in record && 'document' in record) {
    const problems = validateDraft(record.metadata, record.document);
    if (problems.length) return { problems };
    const metadata = ArticleMetadataSchema.parse(record.metadata);
    const document = ArticleDocumentSchema.parse(record.document);
    const seoSettings = resolveArticleSeoSettings(record.seoSettings);
    return {
      converted: {
        metadata,
        document,
        seoSettings,
        markerCount: countDraftMarkers(metadata, document),
        warnings: [],
      },
      problems: [],
    };
  }

  const input = rawInput as ConsoleArticleInput;
  const warnings: string[] = [];
  const mediaOverrides = options.mediaOverrides ?? {};
  const mediaMap: Record<string, ConsoleMediaRef> = {
    ...(input.workspace?.media ?? {}),
    ...(input.media ?? {}),
  };

  const usedHeadingIds = new Set<string>();
  const content: ArticleNode[] = [];
  if (input.summary) content.push(...parseRichHtmlToBlocks(input.summary));

  for (const section of input.sections ?? []) {
    content.push({
      type: 'heading',
      attrs: { level: 2, id: toSectionId(section.id, usedHeadingIds) },
      content: [{ type: 'text', text: section.heading?.trim() || 'หัวข้อ' }],
    });
    if (section.lead) content.push(...parseRichHtmlToBlocks(section.lead));
    for (const block of section.blocks ?? []) {
      content.push(...convertBlock(block, mediaMap, mediaOverrides, usedHeadingIds, warnings));
    }
    for (const sub of section.subsections ?? []) {
      content.push({
        type: 'heading',
        attrs: { level: 3, id: toSectionId(sub.id, usedHeadingIds) },
        content: [{ type: 'text', text: sub.heading?.trim() || 'หัวข้อย่อย' }],
      });
      for (const block of sub.blocks ?? []) {
        content.push(...convertBlock(block, mediaMap, mediaOverrides, usedHeadingIds, warnings));
      }
    }
  }

  if (input.faq?.length) {
    content.push({
      type: 'heading',
      attrs: { level: 2, id: toSectionId('faq', usedHeadingIds) },
      content: [{ type: 'text', text: 'คำถามที่พบบ่อย' }],
    });
    for (const item of input.faq) {
      content.push({
        type: 'heading',
        attrs: { level: 3, id: toSectionId(item.id, usedHeadingIds) },
        content: [{ type: 'text', text: item.question.trim() }],
      });
      content.push(...parseRichHtmlToBlocks(item.answer));
    }
  }

  const summaryPlain = stripHtmlToPlain(input.summary ?? '');
  const title = clamp(input.title?.trim() || 'บทความใหม่', 300);
  const excerpt = clamp(summaryPlain || title, 600);
  const author = input.byline?.author;
  const reviewer = input.byline?.reviewer;

  const metadataInput: ArticleMetadata = {
    title,
    slug: clamp((input.seo?.slug ?? '').trim(), 120),
    excerpt,
    category: clamp(options.category?.trim() || 'คำแนะนำ', 100),
    authorName: clamp(author?.name?.trim() || 'ทีมงาน Siamrooftech', 160),
    authorType: author?.kind === 'Person' ? 'Person' : 'Organization',
    ...(isValidPublicUrl(author?.url) ? { authorUrl: isValidPublicUrl(author?.url) } : {}),
    ...(reviewer?.name?.trim() ? {
      reviewerName: clamp(reviewer.name.trim(), 160),
      reviewerType: reviewer.kind === 'Person' ? 'Person' : 'Organization',
      ...(isValidPublicUrl(reviewer.url) ? { reviewerUrl: isValidPublicUrl(reviewer.url) } : {}),
    } : {}),
    topic: clamp((input.brief?.focusKeyword ?? '').trim() || title, 200),
    intent: input.brief?.intent === 'commercial_investigation' ? 'commercial' : 'informational',
    tags: (input.brief?.secondaryKeywords ?? []).map((tag) => clamp(tag, 60)).filter(Boolean).slice(0, 20),
    seoTitle: clamp((input.seo?.metaTitle ?? '').trim() || title, 300),
    seoDescription: clamp((input.seo?.metaDescription ?? '').trim() || excerpt, 600),
    sources: (input.sources ?? [])
      .flatMap((source) => {
        const validUrl = isValidPublicUrl(source.url);
        const label = source.title?.trim();
        return validUrl && label ? [{ label: clamp(label, 200), url: validUrl }] : [];
      })
      .slice(0, 50),
  };

  const documentInput: ArticleDocument = { type: 'doc', content };
  const problems = validateDraft(metadataInput, documentInput);
  if (problems.length) return { problems };

  const metadata = ArticleMetadataSchema.parse(metadataInput);
  const document = ArticleDocumentSchema.parse(documentInput);
  const seoSettings = resolveArticleSeoSettings({
    primaryKeyword: input.brief?.focusKeyword?.trim() || undefined,
    secondaryKeywords: input.brief?.secondaryKeywords ?? [],
    primaryAliases: [],
  });

  return {
    converted: {
      metadata,
      document,
      seoSettings,
      markerCount: countDraftMarkers(metadata, document),
      warnings,
    },
    problems: [],
  };
}
