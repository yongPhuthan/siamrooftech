import type { ArticleDocument, ArticleNode } from '../document-schema';

export interface TextRun { text: string; from: number; to: number }
export interface ContentSegment {
  text: string;
  runs: TextRun[];
  kind: 'heading' | 'body' | 'caption';
  headingId?: string;
  headingLevel?: 2 | 3;
  from: number;
  to: number;
}

export interface ArticleLinkEvidence {
  href: string;
  text: string;
  from?: number;
  to?: number;
}

export interface ArticleImageEvidence {
  alt: string | null;
  decorative: boolean;
  width?: number | null;
  height?: number | null;
  from: number;
}

function nodeSize(node: ArticleNode): number {
  if (node.type === 'text') return node.text.length;
  if (node.type === 'image') return 1;
  return 2 + (node.content ?? []).reduce((sum, child) => sum + nodeSize(child), 0);
}

function gatherInline(node: ArticleNode, position: number, runs: TextRun[], links: ArticleLinkEvidence[]): void {
  if (node.type === 'text') {
    const from = position;
    const to = from + node.text.length;
    runs.push({ text: node.text, from, to });
    for (const mark of node.marks ?? []) {
      if (mark.type === 'link') links.push({ href: mark.attrs.href, text: node.text, from, to });
    }
    return;
  }
  if (!('content' in node)) return;
  let childPosition = position + 1;
  for (const child of node.content ?? []) {
    gatherInline(child, childPosition, runs, links);
    childPosition += nodeSize(child);
  }
}

export function extractArticleContent(document: ArticleDocument): { segments: ContentSegment[]; links: ArticleLinkEvidence[]; images: ArticleImageEvidence[] } {
  const segments: ContentSegment[] = [];
  const links: ArticleLinkEvidence[] = [];
  const images: ArticleImageEvidence[] = [];

  const visit = (node: ArticleNode, position: number) => {
    if (node.type === 'text') return;
    if (node.type === 'image') {
      images.push({ alt: node.attrs.alt, decorative: Boolean(node.attrs.decorative), width: node.attrs.width, height: node.attrs.height, from: position });
      if (node.attrs.caption?.trim()) segments.push({ text: node.attrs.caption, runs: [], kind: 'caption', from: position, to: position + 1 });
      return;
    }
    if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'tableCell' || node.type === 'tableHeader') {
      const runs: TextRun[] = [];
      gatherInline(node, position, runs, links);
      const text = runs.map((run) => run.text).join('');
      segments.push({
        text,
        runs,
        kind: node.type === 'heading' ? 'heading' : 'body',
        ...(node.type === 'heading' ? { headingId: node.attrs.id, headingLevel: node.attrs.level } : {}),
        from: position,
        to: position + nodeSize(node),
      });
      return;
    }
    let childPosition = position + (node.type === 'doc' ? 0 : 1);
    for (const child of node.content ?? []) {
      visit(child, childPosition);
      childPosition += nodeSize(child);
    }
  };

  let position = 0;
  for (const node of document.content) {
    visit(node, position);
    position += nodeSize(node);
  }

  return { segments, links: mergeLinkRuns(links), images };
}

function mergeLinkRuns(links: ArticleLinkEvidence[]): ArticleLinkEvidence[] {
  const merged: ArticleLinkEvidence[] = [];
  for (const link of links) {
    const previous = merged.at(-1);
    if (previous && previous.href === link.href && previous.to === link.from) {
      previous.text += link.text;
      previous.to = link.to;
    } else merged.push({ ...link });
  }
  return merged;
}
