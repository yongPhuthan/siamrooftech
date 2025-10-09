import Link from 'next/link';
import Image from 'next/image';
import { Article } from '../../../lib/firestore';

interface ArticleCardProps {
  article: Article;
}

// Helper function to format date
function formatDate(timestamp: any): string {
  if (!timestamp) return '';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return '';
  }
}

/**
 * ArticleCard Component
 *
 * Reusable article card following the PROJECT_UI_DESIGN.md patterns
 * - Design matches PortfolioCard (rounded-2xl, shadow-sm → shadow-2xl)
 * - Blue color scheme (blue-600, blue-700)
 * - Hover effects: scale, shadow, translate
 * - Aesthetic-Usability Effect: Beautiful and functional
 */
export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block"
    >
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
        {/* Image Container - aspect-[4/3] like Portfolio */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={article.featured_image || '/images/default-article.jpg'}
            alt={article.title}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Category Badge - Top Left */}
          <div className="absolute top-3 left-3">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm shadow-sm">
              {article.category}
            </span>
          </div>

          {/* Read Time Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <span className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium text-gray-800 shadow-sm">
              {article.read_time}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Meta: Author + Date */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate">{article.author}</span>
            </div>
            <div className="text-gray-500 font-medium">
              {formatDate(article.published_at || article.created_at)}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>

          {/* Tags - Miller's Law: Show max 3 tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{article.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* CTA - Hidden until hover (Von Restorff Effect) */}
          <div className="pt-2 border-t border-gray-100">
            <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 flex items-center">
              อ่านต่อ
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
