import Link from 'next/link';
import Image from 'next/image';
import { ArticleSnapshot } from '@/features/articles/publication-policy';
import { articlePath } from '@/features/articles/article-path';
import { PublicBadge, PublicCard } from '@/components/ui/public';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Bangkok' });
}

export default function ArticleCard({ article }: { article: ArticleSnapshot }) {
  const { metadata } = article;
  return (
    <Link href={articlePath(metadata.slug)} className="group block">
      <PublicCard variant="interactive" className="h-full overflow-hidden">
        <div className="relative aspect-[4/3] bg-slate-100">
          <Image src={metadata.coverImage || '/images/default-article.jpg'} alt={metadata.coverAlt || ''} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
          <span className="absolute left-3 top-3"><PublicBadge tone="brand">{metadata.category}</PublicBadge></span>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-site-muted">{metadata.authorName} · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></p>
          <h2 className="line-clamp-2 text-lg font-semibold text-site-ink group-hover:text-site-brand-strong">{metadata.title}</h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-site-muted">{metadata.excerpt}</p>
          {metadata.tags.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="แท็กบทความ">{metadata.tags.slice(0, 3).map((tag) => <li key={tag} className="text-xs text-site-muted">#{tag}</li>)}</ul>}
        </div>
      </PublicCard>
    </Link>
  );
}
