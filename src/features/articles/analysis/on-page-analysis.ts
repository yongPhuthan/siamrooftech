import { collectArticleHeadings } from '../heading-outline';
import type { ArticleDocument, ArticleMetadata, ArticleSeoSettings } from '../document-schema';
import { extractArticleContent, type ArticleLinkEvidence, type ContentSegment, type TextRun } from './text-extraction';

export const ARTICLE_ANALYSIS_RULESET = 'on-page-local-v1';
export type AnalysisStatus = 'found' | 'consider' | 'manual';
export type AnalysisTarget = { kind: 'text'; from: number; to: number } | { kind: 'field'; field: string } | { kind: 'heading'; id: string } | { kind: 'image'; from: number };

export interface AnalysisFinding {
  id: string;
  status: AnalysisStatus;
  title: string;
  reason: string;
  evidence: string;
  target?: AnalysisTarget;
}

export interface KeywordAnalysis {
  phrase: string;
  kind: 'primary' | 'secondary' | 'alias';
  occurrences: number;
  perHundredWords: number | null;
  locations: Array<{ label: string; count: number; target?: AnalysisTarget }>;
  matches: Array<{ text: string; excerpt: string; target: AnalysisTarget }>;
}

export interface ArticleOnPageAnalysis {
  ruleset: typeof ARTICLE_ANALYSIS_RULESET;
  wordCount: number | null;
  wordCountMethod: 'Intl.Segmenter:th/word' | null;
  keywords: KeywordAnalysis[];
  title: { value: string; characters: number; present: boolean };
  description: { value: string; characters: number; present: boolean };
  previewPath: string;
  headings: ReturnType<typeof collectArticleHeadings>;
  links: { internal: number; external: number; fragment: number; contact: number; concerns: AnalysisFinding[] };
  images: { total: number; concerns: AnalysisFinding[] };
  editorial: { authorPresent: boolean; reviewerPresent: boolean; sources: number };
  findings: AnalysisFinding[];
}

type WordSegment = { text: string; index: number; end: number };
type Match = { text: string; excerpt: string; from: number; to: number; segment: ContentSegment; target: AnalysisTarget };

function makeSegmenter(): Intl.Segmenter | null {
  try { return typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('th', { granularity: 'word' }) : null; }
  catch { return null; }
}

function getWords(text: string, segmenter: Intl.Segmenter): WordSegment[] {
  return Array.from(segmenter.segment(text))
    .filter((part) => part.isWordLike)
    .map((part) => ({ text: part.segment, index: part.index, end: part.index + part.segment.length }));
}

function phraseTokens(phrase: string, segmenter: Intl.Segmenter): string[] {
  return getWords(phrase.normalize('NFC'), segmenter).map((word) => word.text.toLowerCase());
}

function mapNormalizedRangeToSource(text: string, from: number, to: number): { from: number; to: number } | null {
  let normalized = '';
  const ranges: Array<{ from: number; to: number }> = [];
  for (let offset = 0; offset < text.length;) {
    const codePoint = text.codePointAt(offset);
    if (codePoint === undefined) break;
    const sourceChar = String.fromCodePoint(codePoint);
    const start = offset;
    const end = offset + sourceChar.length;
    const next = (normalized + sourceChar).normalize('NFC');
    const oldLength = normalized.length;
    if (next.length < oldLength) {
      normalized = next;
      const affected = Math.max(0, ranges.length - 1);
      if (ranges[affected]) ranges[affected].to = end;
    } else {
      normalized = next;
      for (let i = oldLength; i < next.length; i += 1) ranges[i] = { from: start, to: end };
      if (next.length === oldLength && ranges.length) ranges[ranges.length - 1].to = end;
    }
    offset = end;
  }
  if (from < 0 || to <= from || !ranges[from] || !ranges[to - 1]) return null;
  return { from: ranges[from].from, to: ranges[to - 1].to };
}

function segmentMatches(segment: ContentSegment, phrase: string, segmenter: Intl.Segmenter): Match[] {
  const source = segment.text;
  const normalized = source.normalize('NFC');
  const words = getWords(normalized, segmenter);
  const wanted = phraseTokens(phrase, segmenter);
  if (!wanted.length) return [];
  const matches: Match[] = [];
  for (let start = 0; start <= words.length - wanted.length;) {
    const found = words.slice(start, start + wanted.length);
    if (found.every((word, index) => word.text.toLowerCase() === wanted[index])) {
      const normalizedRange = mapNormalizedRangeToSource(source, found[0].index, found.at(-1)!.end);
      if (normalizedRange) {
        const from = mapTextOffsetToPosition(segment.runs, normalizedRange.from);
        const to = mapTextOffsetToPosition(segment.runs, normalizedRange.to);
        const excerptStart = Math.max(0, normalizedRange.from - 32);
        const excerptEnd = Math.min(source.length, normalizedRange.to + 32);
        matches.push({ text: source.slice(normalizedRange.from, normalizedRange.to), excerpt: `${excerptStart ? '…' : ''}${source.slice(excerptStart, excerptEnd)}${excerptEnd < source.length ? '…' : ''}`, from, to, segment, target: segment.kind === 'caption' ? { kind: 'image', from: segment.from } : { kind: 'text', from, to } });
      }
      start += wanted.length;
    } else start += 1;
  }
  return matches;
}

function mapTextOffsetToPosition(runs: TextRun[], offset: number): number {
  let remaining = offset;
  for (const run of runs) {
    if (remaining <= run.text.length) return run.from + remaining;
    remaining -= run.text.length;
  }
  return runs.at(-1)?.to ?? 0;
}

function countMatchesByPhrase(segments: ContentSegment[], phrase: string, segmenter: Intl.Segmenter): Match[] {
  return segments.flatMap((segment) => segmentMatches(segment, phrase, segmenter));
}

function isPhrasePresent(text: string, phrase: string, segmenter: Intl.Segmenter): boolean {
  return segmentMatches({ text, runs: [], kind: 'body', from: 0, to: 0 }, phrase, segmenter).length > 0;
}

function analyzeLinks(links: ArticleLinkEvidence[]): ArticleOnPageAnalysis['links'] {
  const counts = { internal: 0, external: 0, fragment: 0, contact: 0, concerns: [] as AnalysisFinding[] };
  for (const link of links) {
    if (link.href.startsWith('#')) counts.fragment += 1;
    else if (/^(mailto|tel):/i.test(link.href)) counts.contact += 1;
    else if (link.href.startsWith('/') && !link.href.startsWith('//')) counts.internal += 1;
    else counts.external += 1;
    const normalized = link.text.trim().toLowerCase();
    const target: AnalysisTarget | undefined = link.from !== undefined && link.to !== undefined ? { kind: 'text', from: link.from, to: link.to } : undefined;
    if (!normalized) counts.concerns.push({ id: `link-empty-${counts.concerns.length}`, status: 'consider', title: 'ลิงก์ไม่มีข้อความกำกับ', reason: 'ผู้ใช้โปรแกรมอ่านหน้าจออาจไม่ทราบปลายทางของลิงก์', evidence: `ปลายทาง ${link.href}`, target });
    else if (/^(คลิกที่นี่|ที่นี่|อ่านเพิ่มเติม|เพิ่มเติม|click here|here|read more|more)$/.test(normalized)) counts.concerns.push({ id: `link-generic-${counts.concerns.length}`, status: 'consider', title: 'ข้อความลิงก์ยังไม่บอกปลายทาง', reason: 'พิจารณาใช้ข้อความที่อธิบายหน้าหรือข้อมูลปลายทาง', evidence: `“${link.text}” → ${link.href}`, target });
  }
  return counts;
}

function findContentTarget(matches: Match[]): AnalysisTarget | undefined {
  const match = matches[0];
  return match?.target;
}

function sectionLabel(segment: ContentSegment, currentHeading: string | undefined): string {
  if (segment.kind === 'heading') return segment.headingLevel === 2 ? `H2: ${segment.text || 'หัวข้อว่าง'}` : `H3: ${segment.text || 'หัวข้อว่าง'}`;
  return currentHeading ? `ส่วน: ${currentHeading}` : 'บทนำ';
}

export function analyzeArticleOnPage(input: {
  metadata: ArticleMetadata;
  document: ArticleDocument;
  seoSettings: ArticleSeoSettings;
  wordSegmenter?: Intl.Segmenter | null;
}): ArticleOnPageAnalysis {
  const extracted = extractArticleContent(input.document);
  const segmenter = input.wordSegmenter === undefined ? makeSegmenter() : input.wordSegmenter;
  const bodySegments = extracted.segments;
  const wordCount = segmenter ? bodySegments.reduce((sum, segment) => sum + getWords(segment.text.normalize('NFC'), segmenter).length, 0) : null;
  const headings = collectArticleHeadings(input.document);
  const findings: AnalysisFinding[] = [];

  const keywordSpecs: Array<{ phrase: string; kind: KeywordAnalysis['kind'] }> = [];
  const primary = input.seoSettings.primaryKeyword?.normalize('NFC').trim();
  if (primary) keywordSpecs.push({ phrase: primary, kind: 'primary' });
  for (const phrase of input.seoSettings.secondaryKeywords) keywordSpecs.push({ phrase: phrase.normalize('NFC').trim(), kind: 'secondary' });
  for (const phrase of input.seoSettings.primaryAliases) keywordSpecs.push({ phrase: phrase.normalize('NFC').trim(), kind: 'alias' });

  const keywords: KeywordAnalysis[] = keywordSpecs.map(({ phrase, kind }) => {
    if (!segmenter) return { phrase, kind, occurrences: 0, perHundredWords: null, locations: [], matches: [] };
    const matches = countMatchesByPhrase(extracted.segments, phrase, segmenter);
    let activeHeading: string | undefined;
    const locations = new Map<string, { count: number; target?: AnalysisTarget }>();
    for (const segment of extracted.segments) {
      if (segment.kind === 'heading' && segment.headingLevel === 2) activeHeading = segment.text;
      const label = sectionLabel(segment, activeHeading);
      const segmentHits = segmentMatches(segment, phrase, segmenter);
      if (segmentHits.length) {
        const current = locations.get(label) ?? { count: 0, target: findContentTarget(segmentHits) };
        current.count += segmentHits.length;
        locations.set(label, current);
      }
    }
    const exactTitle = isPhrasePresent(input.metadata.title, phrase, segmenter);
    const exactSeoTitle = isPhrasePresent(input.metadata.seoTitle, phrase, segmenter);
    const headingMatches = extracted.segments.filter((segment) => segment.kind === 'heading' && segmentMatches(segment, phrase, segmenter).length > 0);
    const firstHeadingIndex = extracted.segments.findIndex((segment) => segment.kind === 'heading');
    const intro = (firstHeadingIndex < 0 ? extracted.segments : extracted.segments.slice(0, firstHeadingIndex)).filter((segment) => segment.kind === 'body');
    const introMatches = intro.flatMap((segment) => segmentMatches(segment, phrase, segmenter));
    const headingCount = headingMatches.reduce((sum, segment) => sum + segmentMatches(segment, phrase, segmenter).length, 0);
    const placements = [
      { label: 'ชื่อบทความ', count: exactTitle ? 1 : 0, target: { kind: 'field', field: 'metadata.title' } as AnalysisTarget },
      { label: 'SEO title', count: exactSeoTitle ? 1 : 0, target: { kind: 'field', field: 'metadata.seoTitle' } as AnalysisTarget },
      { label: 'บทนำ', count: introMatches.length, target: findContentTarget(introMatches) },
      { label: 'หัวข้อ', count: headingCount, target: findContentTarget(headingMatches.flatMap((segment) => segmentMatches(segment, phrase, segmenter))) },
      ...Array.from(locations, ([label, value]) => ({ label, count: value.count, target: value.target })),
    ];
    return { phrase, kind, occurrences: matches.length, perHundredWords: wordCount ? matches.length / wordCount * 100 : null, locations: placements, matches: matches.map((match) => ({ text: match.text, excerpt: match.excerpt, target: match.target })) };
  });

  if (keywordSpecs.length && !segmenter) findings.push({ id: 'keyword-segmentation-unavailable', status: 'manual', title: 'ตรวจจำนวนคำและคีย์เวิร์ดไม่ได้', reason: 'runtime นี้ไม่มี Intl.Segmenter สำหรับภาษาไทย', evidence: 'ยังตรวจหัวข้อ ลิงก์ รูปภาพ และ metadata ต่อได้' });
  for (const keyword of keywords) {
    const found = keyword.occurrences > 0;
    const unavailable = wordCount === null;
    findings.push({
      id: `keyword-${keyword.kind}-${keyword.phrase}`,
      status: unavailable ? 'manual' : found ? 'found' : 'consider',
      title: unavailable ? `ต้องตรวจวลี “${keyword.phrase}” เอง` : found ? `พบวลี “${keyword.phrase}”` : `ยังไม่พบวลี “${keyword.phrase}” ในเนื้อหา`,
      reason: unavailable ? 'runtime นี้ไม่มีตัวตัดคำภาษาไทย จึงยังยืนยันจำนวนครั้งไม่ได้' : wordCount === 0 ? `พบ ${keyword.occurrences} ครั้ง; ยังหารความถี่ไม่ได้เพราะเนื้อหาไม่มีคำ` : `พบ ${keyword.occurrences} ครั้ง (${keyword.perHundredWords!.toFixed(2)} ครั้งต่อ 100 คำ โดยประมาณ)`,
      evidence: unavailable ? 'การนับคำและวลีตรวจไม่ได้ในสภาพแวดล้อมนี้' : keyword.matches.slice(0, 5).map((match) => match.excerpt).join(' · ') || 'ไม่มีข้อความที่ตรงกับคำหรือวลีนี้ตามขอบเขตคำ',
      target: keyword.matches[0]?.target ?? { kind: 'field', field: 'seoSettings.primaryKeyword' },
    });
  }

  const titlePresent = Boolean(input.metadata.seoTitle.trim());
  const descriptionPresent = Boolean(input.metadata.seoDescription.trim());
  findings.push({ id: 'seo-title', status: titlePresent ? 'found' : 'consider', title: titlePresent ? 'มี SEO title' : 'ยังไม่มี SEO title', reason: 'จำนวนอักขระเป็นเพียงตัวช่วยตรวจ ไม่ใช่การรับประกันว่าจะแสดงครบในผลค้นหา', evidence: `${input.metadata.seoTitle.length} อักขระ`, target: { kind: 'field', field: 'metadata.seoTitle' } });
  findings.push({ id: 'seo-description', status: descriptionPresent ? 'found' : 'consider', title: descriptionPresent ? 'มี meta description' : 'ยังไม่มี meta description', reason: 'ตัวอย่างผลค้นหาอาจถูก Google ปรับตามคำค้นและอุปกรณ์', evidence: `${input.metadata.seoDescription.length} อักขระ`, target: { kind: 'field', field: 'metadata.seoDescription' } });
  for (const heading of headings) {
    if (!heading.text.trim()) findings.push({ id: `heading-empty-${heading.id}`, status: 'consider', title: 'มีหัวข้อว่าง', reason: 'ใส่ชื่อหัวข้อที่สื่อสารเนื้อหาส่วนนั้น', evidence: `H${heading.level}`, target: { kind: 'heading', id: heading.id } });
    if (heading.incomplete) findings.push({ id: `heading-incomplete-${heading.id}`, status: 'consider', title: 'ส่วนนี้ยังไม่มีเนื้อหา', reason: 'โครงร่างยังเปิดเป็นร่างได้; เพิ่มเนื้อหาเมื่อพร้อม', evidence: heading.text || `H${heading.level}`, target: { kind: 'heading', id: heading.id } });
  }
  if (!headings.length) findings.push({ id: 'headings-none', status: 'consider', title: 'ยังไม่มีหัวข้อ H2/H3', reason: 'เพิ่มหัวข้อเมื่อโครงสร้างบทความชัดเจน', evidence: 'ไม่มี heading ใน document', target: { kind: 'field', field: 'document' } });

  const links = analyzeLinks(extracted.links);
  findings.push(...links.concerns);
  const imageConcerns: AnalysisFinding[] = [];
  extracted.images.forEach((image, index) => {
    if (!image.decorative && !image.alt?.trim()) imageConcerns.push({ id: `image-alt-${index}`, status: 'consider', title: 'ภาพยังไม่มี alt', reason: 'เพิ่มคำอธิบายตามหน้าที่ของภาพ หรือกำหนดเป็นภาพตกแต่ง', evidence: `ภาพลำดับ ${index + 1}`, target: { kind: 'image', from: image.from } });
    if (!image.width || !image.height) imageConcerns.push({ id: `image-dimensions-${index}`, status: 'consider', title: 'ภาพยังไม่มี dimensions ครบ', reason: 'ระบุความกว้างและความสูงเพื่อช่วยกันพื้นที่ layout shift', evidence: `ภาพลำดับ ${index + 1}`, target: { kind: 'image', from: image.from } });
  });
  findings.push(...imageConcerns);

  const editorial = { authorPresent: Boolean(input.metadata.authorName.trim()), reviewerPresent: Boolean(input.metadata.reviewerName?.trim()), sources: input.metadata.sources.length };
  findings.push({ id: 'editorial-author', status: editorial.authorPresent ? 'found' : 'consider', title: editorial.authorPresent ? 'ระบุผู้เขียนแล้ว' : 'ยังไม่ระบุผู้เขียน', reason: 'ระบบตรวจเฉพาะข้อมูลที่กรอก ไม่ยืนยันคุณวุฒิหรือความเชี่ยวชาญ', evidence: input.metadata.authorName || 'ไม่มีชื่อผู้เขียน', target: { kind: 'field', field: 'metadata.authorName' } });
  findings.push({ id: 'editorial-sources', status: editorial.sources ? 'found' : 'manual', title: editorial.sources ? 'มีแหล่งอ้างอิงใน metadata' : 'ยังไม่มีแหล่งอ้างอิงใน metadata', reason: 'การมี URL ไม่ได้ยืนยันว่าแหล่งข้อมูลรองรับข้อความในบทความ', evidence: `${editorial.sources} รายการ`, target: { kind: 'field', field: 'metadata.sources' } });
  findings.push({ id: 'editorial-reviewer', status: editorial.reviewerPresent ? 'found' : 'manual', title: editorial.reviewerPresent ? 'ระบุผู้ตรวจทานแล้ว' : 'ยังไม่ระบุผู้ตรวจทาน', reason: 'ระบบไม่ประเมินความถูกต้อง ความครบถ้วน หรือการถูกอ้างอิงโดย AI', evidence: input.metadata.reviewerName || 'ไม่มีชื่อผู้ตรวจทาน', target: { kind: 'field', field: 'metadata.reviewerName' } });

  return {
    ruleset: ARTICLE_ANALYSIS_RULESET,
    wordCount,
    wordCountMethod: segmenter ? 'Intl.Segmenter:th/word' : null,
    keywords,
    title: { value: input.metadata.seoTitle, characters: input.metadata.seoTitle.length, present: titlePresent },
    description: { value: input.metadata.seoDescription, characters: input.metadata.seoDescription.length, present: descriptionPresent },
    previewPath: `/articles/${input.metadata.slug || 'article-url'}`,
    headings,
    links: { internal: links.internal, external: links.external, fragment: links.fragment, contact: links.contact, concerns: links.concerns },
    images: { total: extracted.images.length, concerns: imageConcerns },
    editorial,
    findings,
  };
}
