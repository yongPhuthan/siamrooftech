import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { articlesAdminService } from '@/lib/firestore-admin';
import { Article } from '@/lib/firestore';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import FinalCTASection from '../../components/FinalCTASection';
import { unstable_cache } from 'next/cache';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Revalidate every hour

// Fetch single article data with caching
const fetchArticleData = (slug: string) =>
  unstable_cache(
    async () => {
      // ✅ Decode URL-encoded slug (รองรับภาษาไทย)
      const decodedSlug = decodeURIComponent(slug);
      console.log(`🆕 [fetchArticleData] CACHE MISS → Fetching slug: ${decodedSlug}`);
      const article = await articlesAdminService.getBySlug(decodedSlug);
      return article || null;
    },
    [`article-data-${slug}`],
    { revalidate: 3600 }
  )();

// Fetch all articles for related articles
const fetchAllArticles = unstable_cache(
  async (): Promise<Article[]> => {
    console.log('🆕 [fetchAllArticles] CACHE MISS → Fetching all articles');
    const articles = await articlesAdminService.getAll();
    return articles || [];
  },
  ['all-articles-data'],
  { revalidate: 3600 }
);

// Generate static params for SSG
export async function generateStaticParams() {
  const articles = await articlesAdminService.getAll();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleData(slug);

  if (!article) {
    return {
      title: 'ไม่พบบทความ | Siamrooftech',
    };
  }

  const title = article.seoTitle || `${article.title} | บทความกันสาดพับได้`;
  const description = article.seoDescription || article.excerpt;
  const keywords = article.seoKeywords?.join(', ') || 'กันสาดพับได้, บทความ';
  const canonicalUrl = `https://www.siamrooftech.com/articles/${article.slug}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      publishedTime: article.published_at || article.created_at,
      modifiedTime: article.lastModified || article.updated_at,
      authors: [article.author],
      tags: article.tags,
      images: article.featured_image ? [
        {
          url: article.featured_image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.featured_image ? [article.featured_image] : [],
    },
  };
}

// Helper function to format date
function formatDate(timestamp: any): string {
  if (!timestamp) return '';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return '';
  }
}

function convertMarkdownToHtml(content: string): string {
  if (!content) return '';

  const normalized = content.replace(/\r\n/g, '\n').trim();

  if (!normalized) return '';

  return normalized
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-gray-900 underline hover:text-gray-600 transition-colors">$1</a>')
    .replace(/^### (.+)$/gm, '<h3 class="text-2xl font-bold text-gray-900 mt-10 mb-4">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-6">')
    .replace(/^(.+)$/gm, '<p class="mb-6 text-gray-700">$1</p>');
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchArticleData(slug);

  if (!article) {
    notFound();
  }

  // Get related articles (same category, limit 3)
  const allArticles = await fetchAllArticles();
  const relatedArticles = allArticles
    .filter(a => a.category === article.category && a.id !== article.id)
    .slice(0, 3);
  const sortedBlocks = (article.blocks ?? []).slice().sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );
  const hasBlockContent = sortedBlocks.length > 0;
  const featuredImageUrl = article.featured_image || sortedBlocks[0]?.image || '';

  // Structured Data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featured_image || 'https://www.siamrooftech.com/og-image.jpg',
    datePublished: article.published_at || article.created_at,
    dateModified: article.lastModified || article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Siamrooftech',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.siamrooftech.com/logo.png',
      },
    },
    articleBody: article.content,
    wordCount: article.content.split(/\s+/).length,
    keywords: article.seoKeywords?.join(', ') || article.tags.join(', '),
    articleSection: article.category,
    inLanguage: 'th-TH',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.siamrooftech.com/articles/${article.slug}`,
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-white">
        {/* Breadcrumbs - Clean design */}
        <div className="border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumbs
              items={[
                { name: 'หน้าแรก', href: '/' },
                { name: 'บทความ', href: '/articles' },
                { name: article.category, href: `/articles?category=${article.category}` },
                { name: article.title, href: `/articles/${article.slug}` },
              ]}
            />
          </div>
        </div>

        {/* Article Content - Clean & Minimal */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Category Label - Subtle */}
          <div className="mb-6">
            <span className="inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
              {article.category}
            </span>
          </div>

          {/* Title - Clean Typography */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            {article.title}
          </h1>

          {/* Meta Info - Minimal */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-10 pb-8 border-b border-gray-100">
            <span>{article.author}</span>
            <span className="text-gray-300">|</span>
            <time dateTime={article.published_at || article.created_at}>
              {formatDate(article.published_at || article.created_at)}
            </time>
            <span className="text-gray-300">|</span>
            <span>{article.read_time}</span>
          </div>

          {/* Featured Image - Clean rounded corners */}
          {featuredImageUrl && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg mb-10">
              <Image
                src={featuredImageUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Excerpt - Subtle highlight */}
          <div className="text-lg text-gray-700 leading-relaxed mb-10 pl-4 border-l-2 border-gray-900">
            {article.excerpt}
          </div>

          {/* Content - Clean Typography with better readability */}
          {hasBlockContent ? (
            <div className="space-y-12">
              {sortedBlocks.map((block, index) => {
                const htmlContent = convertMarkdownToHtml(block.content || '');
                const showBlockImage = Boolean(block.image) && index !== 0;

                return (
                  <section key={block.id || index} className="space-y-6">
                    {showBlockImage && (
                      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={block.image as string}
                          alt={`รูปประกอบบทความลำดับที่ ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 900px, 100vw"
                          priority={false}
                        />
                      </div>
                    )}
                    {htmlContent && (
                      <div
                        className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <div
                className="text-gray-800 leading-relaxed space-y-4"
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.8',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
                dangerouslySetInnerHTML={{
                  __html: convertMarkdownToHtml(article.content || ''),
                }}
              />
            </div>
          )}

          {/* Tags - Minimal style */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Related Articles - Clean minimal cards */}
        {relatedArticles.length > 0 && (
          <section className="bg-gray-50 py-16 sm:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
                บทความที่เกี่ยวข้อง
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/articles/${related.slug}`}
                    className="group block"
                  >
                    <article className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-md">
                      {/* Image */}
                      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                        <Image
                          src={related.featured_image || '/images/default-article.jpg'}
                          alt={related.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {related.category}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-gray-600 transition-colors">
                          {related.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                          {related.excerpt}
                        </p>
                        <div className="pt-2 text-xs text-gray-500">
                          {related.read_time}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <FinalCTASection
          title="ต้องการคำปรึกษาเกี่ยวกับกันสาดพับได้?"
          subtitle="ติดต่อเราเพื่อรับคำแนะนำจากผู้เชี่ยวชาญ"
        />
      </div>
    </>
  );
}
