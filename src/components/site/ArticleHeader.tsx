import { PublicBadge, PublicHeading } from '@/components/ui/public';

type ArticleHeaderProps = {
  category: string;
  title: string;
  author: string;
  publishedLabel: string;
  publishedAt?: string;
  readTime?: string;
  reviewedBy?: string;
};

export function ArticleHeader({
  category,
  title,
  author,
  publishedLabel,
  publishedAt,
  readTime,
  reviewedBy,
}: ArticleHeaderProps) {
  return (
    <header>
      <div className="mb-6">
        <PublicBadge>{category}</PublicBadge>
      </div>
      <PublicHeading as="h1" level="display" className="mb-6">
        {title}
      </PublicHeading>
      <div className="mb-10 flex flex-wrap items-center gap-4 border-b border-site-border pb-8 text-sm text-site-muted">
        <span>{author}</span>
        {reviewedBy ? <><span aria-hidden="true" className="text-site-border">|</span><span>ตรวจทานโดย {reviewedBy}</span></> : null}
        <span aria-hidden="true" className="text-site-border">|</span>
        <time dateTime={publishedAt}>{publishedLabel}</time>
        {readTime ? (
          <>
            <span aria-hidden="true" className="text-site-border">|</span>
            <span>{readTime}</span>
          </>
        ) : null}
      </div>
    </header>
  );
}
