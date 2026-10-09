import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/site/Breadcrumbs';
import FinalCTASection from '@/components/site/FinalCTASection';
import { ArticleHeader } from '@/components/site/ArticleHeader';
import ArticleCard from '@/app/components/articles/ArticleCard';
import ArticleDocumentView from '@/features/articles/public/ArticleDocumentView';
import ArticleToc from '@/features/articles/public/ArticleToc';
import { articlePath, isValidArticleSlug } from '@/features/articles/article-path';
import { collectArticleHeadings } from '@/features/articles/heading-outline';
import { ArticleSnapshot } from '@/features/articles/publication-policy';
import { getPublishedArticleBySlug, getPublishedArticles } from '@/features/articles/server/repository';
import { canonicalUrl } from '@/lib/seo-config';

interface Props { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic';

async function getArticle(slug: string): Promise<ArticleSnapshot | null> {
  if (!isValidArticleSlug(slug)) return null;
  return getPublishedArticleBySlug(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'ไม่พบบทความ | Siamrooftech', robots: { index: false, follow: false } };
  const { metadata } = article;
  const title = metadata.seoTitle || metadata.title;
  const description = metadata.seoDescription || metadata.excerpt;
  const url = canonicalUrl(articlePath(metadata.slug));
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, type: 'article', url,
      publishedTime: article.publishedAt,
      modifiedTime: article.modifiedAt,
      authors: [metadata.authorName],
      tags: metadata.tags,
      images: metadata.coverImage ? [{ url: metadata.coverImage, alt: metadata.coverAlt || metadata.title }] : [],
    },
    twitter: { card: metadata.coverImage ? 'summary_large_image' : 'summary', title, description, images: metadata.coverImage ? [metadata.coverImage] : [] },
  };
}

function dateLabel(value: string): string {
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' });
}

function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const { metadata } = article;
  const headings = collectArticleHeadings(article.document);
  const allArticles = await getPublishedArticles();
  const related = allArticles.filter((item) => item.articleId !== article.articleId && item.metadata.category === metadata.category).slice(0, 3);
  const url = canonicalUrl(articlePath(metadata.slug));
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: metadata.title,
    description: metadata.excerpt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(metadata.coverImage ? { image: [metadata.coverImage] } : {}),
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt,
    author: { '@type': metadata.authorType, name: metadata.authorName, ...(metadata.authorUrl ? { url: metadata.authorUrl } : {}) },
    ...(metadata.reviewerName ? { reviewedBy: { '@type': metadata.reviewerType, name: metadata.reviewerName, ...(metadata.reviewerUrl ? { url: metadata.reviewerUrl } : {}) } } : {}),
    publisher: { '@type': 'Organization', name: 'Siamrooftech', url: canonicalUrl('/') },
  };

  return (
    <div data-site-theme className="min-h-screen bg-site-canvas text-site-ink">
      <div className="border-b border-site-border bg-white"><Breadcrumbs items={[{ name: 'หน้าแรก', href: '/' }, { name: 'บทความ', href: '/articles' }, { name: metadata.title }]} /></div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <article>
          <div className="mx-auto max-w-4xl">
            <ArticleHeader category={metadata.category} title={metadata.title} author={metadata.authorName} reviewedBy={metadata.reviewerName} publishedAt={article.publishedAt} publishedLabel={dateLabel(article.publishedAt)} />
            {metadata.coverImage && <figure className="mb-8 overflow-hidden rounded border border-site-border bg-white">
              <Image src={metadata.coverImage} alt={metadata.coverAlt || ''} width={1200} height={630} priority className="h-auto w-full object-cover" />
            </figure>}
            <p className="body-lead mb-8 text-site-muted">{metadata.excerpt}</p>
          </div>
          <div className="article-reading-layout grid gap-10 xl:grid-cols-[minmax(0,1fr)_16rem]">
            <ArticleToc headings={headings} />
            <ArticleDocumentView document={article.document} />
          </div>
          {metadata.sources.length > 0 && <section className="mx-auto mt-10 max-w-4xl border-t border-site-border pt-6" aria-labelledby="article-sources-title">
            <h2 id="article-sources-title" className="mb-3 text-lg font-semibold">แหล่งข้อมูล</h2>
            <ul className="list-disc space-y-2 pl-6 text-sm text-site-muted">{metadata.sources.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-site-brand-strong underline underline-offset-4">{source.label}</a></li>)}</ul>
          </section>}
        </article>
        {related.length > 0 && <section className="mt-16 border-t border-site-border pt-10" aria-labelledby="related-articles-title">
          <h2 id="related-articles-title" className="heading-section mb-6">บทความที่เกี่ยวข้อง</h2>
          <div className="grid gap-6 md:grid-cols-3">{related.map((item) => <ArticleCard key={item.articleId} article={item} />)}</div>
        </section>}
        <div className="mt-10"><Link href="/articles" className="text-site-brand-strong underline underline-offset-4">ดูบทความทั้งหมด</Link></div>
      </main>
      <FinalCTASection title="ต้องการคำแนะนำสำหรับโครงการของคุณ" subtitle="ติดต่อ Siamrooftech เพื่อพูดคุยกับทีมงาน" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }} />
    </div>
  );
}
