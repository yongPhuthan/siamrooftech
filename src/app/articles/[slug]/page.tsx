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

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

        {/* Article Content */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {article.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {article.author}
            </div>
            <span>•</span>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(article.published_at || article.created_at)}
            </div>
            <span>•</span>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {article.read_time}
            </div>
          </div>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl mb-8 shadow-lg">
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Excerpt */}
          <div className="text-xl text-gray-700 leading-relaxed mb-8 p-6 bg-blue-50 rounded-xl border-l-4 border-blue-600">
            {article.excerpt}
          </div>

          {/* Content - Aesthetic-Usability: Beautiful typography */}
          <div className="prose prose-lg max-w-none">
            <div
              className="text-gray-800 leading-relaxed"
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.75',
              }}
              dangerouslySetInnerHTML={{
                __html: article.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-700 underline">$1</a>')
                  .replace(/\n\n/g, '</p><p class="mb-4">')
                  .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>'),
              }}
            />
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">แท็ก:</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Related Articles - Miller's Law: 3-4 items */}
        {relatedArticles.length > 0 && (
          <section className="bg-white py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
                บทความที่เกี่ยวข้อง
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/articles/${related.slug}`}
                    className="group block"
                  >
                    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200">
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <Image
                          src={related.featured_image || '/images/default-article.jpg'}
                          alt={related.title}
                          fill
                          className="object-cover transition-all duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                            {related.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {related.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {related.excerpt}
                        </p>
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
