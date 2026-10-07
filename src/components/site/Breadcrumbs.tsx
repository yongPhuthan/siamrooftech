import Link from 'next/link';

interface BreadcrumbItem { name: string; href?: string }
interface BreadcrumbsProps { items: BreadcrumbItem[]; className?: string }

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href && { item: `https://www.siamrooftech.com${item.href}` }),
    })),
  };
  const safeBreadcrumbJson = JSON.stringify(breadcrumbSchema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeBreadcrumbJson }} />
      <nav className={`mx-auto w-full px-4 py-4 ${className}`} aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-site-muted">
          {items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-site-border">/</span>}
              {item.href ? (
                <Link href={item.href} className="transition-colors hover:text-site-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-focus" aria-current={index === items.length - 1 ? 'page' : undefined}>
                  {item.name}
                </Link>
              ) : (
                <span className="font-medium text-site-ink" aria-current="page">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
