import type { ArticleDocument, ArticleNode } from './document-schema';

export interface ArticleHeading {
  id: string;
  level: 2 | 3;
  text: string;
  incomplete: boolean;
}

export interface ArticleOutlineItem extends ArticleHeading {
  children: ArticleHeading[];
}

function inlineText(nodes: ArticleNode[] = []): string {
  return nodes.map((node) => {
    if (node.type === 'text') return node.text;
    if (node.type === 'image') return node.attrs.alt ?? '';
    return 'content' in node && node.content ? inlineText(node.content) : '';
  }).join('').replace(/\s+/g, ' ').trim();
}

function hasSubstantiveContent(node: ArticleNode | undefined): boolean {
  if (!node) return false;
  if (node.type === 'image') return true;
  if (node.type === 'text') return node.text.trim().length > 0;
  return 'content' in node && Boolean(node.content?.some(hasSubstantiveContent));
}

export function collectArticleHeadings(document: ArticleDocument): ArticleHeading[] {
  const topNodes = document.content;
  const headings: ArticleHeading[] = [];
  const indexes = topNodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.type === 'heading');

  for (const { node, index } of indexes) {
    if (node.type !== 'heading' || !node.attrs.id || (node.attrs.level !== 2 && node.attrs.level !== 3)) continue;
    const nextHeading = indexes.find((item) => item.index > index && item.node.type === 'heading' && item.node.attrs.level <= node.attrs.level);
    const end = nextHeading?.index ?? topNodes.length;
    const hasChildHeading = node.attrs.level === 2 && indexes.some((item) => item.index > index && item.index < end && item.node.type === 'heading' && item.node.attrs.level === 3);
    const sectionNodes = topNodes.slice(index + 1, end);
    headings.push({
      id: node.attrs.id,
      level: node.attrs.level,
      text: inlineText(node.content),
      incomplete: !hasChildHeading && !sectionNodes.some(hasSubstantiveContent),
    });
  }
  return headings;
}

export function buildArticleOutline(headings: ArticleHeading[]): ArticleOutlineItem[] {
  const outline: ArticleOutlineItem[] = [];
  for (const heading of headings) {
    if (heading.level === 2) outline.push({ ...heading, children: [] });
    else if (outline.length) outline[outline.length - 1].children.push(heading);
    else outline.push({ ...heading, children: [] });
  }
  return outline;
}
