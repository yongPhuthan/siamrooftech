import type { ArticleDocument, ArticleMark, ArticleNode } from '../document-schema';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

function renderText(text: string, marks: ArticleMark[] = []): string {
  return marks.reduce((content, mark) => {
    if (mark.type === 'bold') return `<strong>${content}</strong>`;
    if (mark.type === 'italic') return `<em>${content}</em>`;
    if (mark.type === 'strike') return `<s>${content}</s>`;
    if (mark.type === 'code') return `<code>${content}</code>`;
    const target = mark.attrs.target === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(mark.attrs.href)}"${target}>${content}</a>`;
  }, escapeHtml(text));
}

function renderNode(node: ArticleNode): string {
  if (node.type === 'text') return renderText(node.text, node.marks);
  if (node.type === 'image') {
    const alt = node.attrs.decorative ? '' : node.attrs.alt ?? '';
    const dimensions = `${node.attrs.width ? ` width="${node.attrs.width}"` : ''}${node.attrs.height ? ` height="${node.attrs.height}"` : ''}`;
    const title = node.attrs.title ? ` title="${escapeHtml(node.attrs.title)}"` : '';
    const image = `<img class="article-document-image" src="${escapeHtml(node.attrs.src)}" alt="${escapeHtml(alt)}"${dimensions}${title} loading="lazy" decoding="async">`;
    const caption = node.attrs.caption ? `<figcaption>${escapeHtml(node.attrs.caption)}</figcaption>` : '';
    return `<figure class="article-document-figure">${image}${caption}</figure>`;
  }
  const children = 'content' in node && node.content ? node.content.map(renderNode).join('') : '';
  const alignmentValue = node.type === 'tableHeader' || node.type === 'tableCell' ? node.attrs?.align : undefined;
  const alignment = alignmentValue === 'left' || alignmentValue === 'center' || alignmentValue === 'right'
    ? ` style="text-align: ${alignmentValue}"`
    : '';
  switch (node.type) {
    case 'doc': return children;
    case 'paragraph': return `<p>${children}</p>`;
    case 'heading': return `<h${node.attrs.level} id="${escapeHtml(node.attrs.id)}">${children}</h${node.attrs.level}>`;
    case 'bulletList': return `<ul>${children}</ul>`;
    case 'orderedList': {
      const start = typeof node.attrs?.start === 'number' && node.attrs.start > 1 ? ` start="${node.attrs.start}"` : '';
      return `<ol${start}>${children}</ol>`;
    }
    case 'listItem': return `<li>${children}</li>`;
    case 'blockquote': return `<blockquote>${children}</blockquote>`;
    case 'table': return `<div class="article-table-scroll"><table><tbody>${children}</tbody></table></div>`;
    case 'tableRow': return `<tr>${children}</tr>`;
    case 'tableHeader': return `<th scope="col"${alignment}>${children}</th>`;
    case 'tableCell': return `<td${alignment}>${children}</td>`;
    default: return '';
  }
}

/** Pure allowlisted JSON-to-HTML renderer shared by public pages and admin preview. */
export function renderArticleDocument(document: ArticleDocument): string {
  return document.content.map(renderNode).join('');
}

export default function ArticleDocumentView({ document }: { document: ArticleDocument }) {
  return <div className="article-content article-document-view" dangerouslySetInnerHTML={{ __html: renderArticleDocument(document) }} />;
}
