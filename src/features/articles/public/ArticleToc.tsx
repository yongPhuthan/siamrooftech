import { ArticleHeading, buildArticleOutline } from '../heading-outline';

function ArticleTocLinks({ headings }: { headings: ArticleHeading[] }) {
  const outline = buildArticleOutline(headings);
  return (
    <ol className="space-y-2 text-sm">
      {outline.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} className="article-toc-link">{item.text}</a>
          {item.children.length > 0 && (
            <ol className="mt-2 ml-3 space-y-2 border-l border-site-border pl-3">
              {item.children.map((child) => <li key={child.id}><a href={`#${child.id}`} className="article-toc-link">{child.text}</a></li>)}
            </ol>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function ArticleToc({ headings }: { headings: ArticleHeading[] }) {
  if (headings.length === 0) return null;
  return (
    <>
      <aside className="article-toc-desktop">
        <h2 className="mb-3 text-base font-semibold">สารบัญเนื้อหา</h2>
        <nav aria-label="สารบัญบทความ"><ArticleTocLinks headings={headings} /></nav>
      </aside>
      <details className="article-toc-mobile">
        <summary>สารบัญเนื้อหา</summary>
        <div className="pt-3"><nav aria-label="สารบัญบทความ"><ArticleTocLinks headings={headings} /></nav></div>
      </details>
    </>
  );
}
