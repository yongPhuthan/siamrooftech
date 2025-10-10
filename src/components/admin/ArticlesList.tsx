"use client";

import { Article } from "../../lib/firestore";
import Image from "next/image";

interface ArticlesListProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onTogglePublish: (article: Article) => void;
}

// Helper function to format date
function formatDate(timestamp: any): string {
  if (!timestamp) return '';

  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return '';
  }
}

// Helper function to calculate read time
function getReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} นาที`;
}

export default function ArticlesList({
  articles,
  onEdit,
  onDelete,
  onTogglePublish
}: ArticlesListProps) {
  return (
    <div className="space-y-4">
      {articles.map((article) => {
        const isPublished = article.isPublished === true;
        const publishDate = formatDate(article.published_at || article.created_at);
        const updatedDate = formatDate(article.updated_at || article.created_at);

        return (
          <article
            key={article.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200"
          >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
            {/* Featured Image - Miller's Law: Visual chunk */}
            <div className="md:col-span-3">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                {article.featured_image ? (
                  <Image
                    src={article.featured_image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="md:col-span-6 space-y-2">
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {article.title}
              </h3>

              {/* Excerpt */}
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {/* Category Badge */}
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                  {article.category}
                </span>

                {/* Author */}
                <span className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {article.author}
                </span>

                {/* Date */}
                <span className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {publishDate}
                </span>

                {/* Read Time */}
                <span className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {article.read_time || getReadTime(article.content)}
                </span>

                {/* View Count */}
                {article.viewCount !== undefined && (
                  <span className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {article.viewCount} views
                  </span>
                )}
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
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
            </div>

            {/* Actions - Mobile: IconButtons, Desktop: Full buttons */}
            <div className="md:col-span-3 flex flex-col gap-3">
              {/* Status Badge */}
              <div className="hidden md:flex items-center justify-start">
                {isPublished ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    เผยแพร่แล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    ฉบับร่าง
                  </span>
                )}
              </div>

              {/* Mobile Status & Actions */}
              <div className="md:hidden border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                    isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="mr-2 flex h-4 w-4 items-center justify-center">
                      {isPublished ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75l1.5 1.5 3-3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v4.125l2.625 2.625" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </span>
                    {isPublished ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                  </span>
                  {updatedDate && (
                    <span className="text-xs text-gray-500">
                      ปรับปรุง {updatedDate}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {/* Toggle Publish */}
                  <button
                    onClick={() => onTogglePublish(article)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      isPublished
                        ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        : 'border-blue-200 bg-white text-blue-700 hover:border-blue-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      {isPublished ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75l1.5 1.5 3-3" />
                        </>
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v4.125l2.625 2.625" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </>
                      )}
                    </svg>
                    <span>{isPublished ? 'ยกเลิกเผยแพร่' : 'เผยแพร่'}</span>
                  </button>

                  {/* Preview / Public View */}
                  <a
                    href={`/articles/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                    title={isPublished ? 'ดูหน้า Public' : 'ดูตัวอย่าง'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      {isPublished ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h19.5" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c2.625 2.768 4.125 6.626 4.125 8.25s-1.5 5.482-4.125 8.25m0-16.5c-2.625 2.768-4.125 6.626-4.125 8.25s1.5 5.482 4.125 8.25" />
                        </>
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c1.5-2.667 4.5-6 9.75-6s8.25 3.333 9.75 6c-1.5 2.667-4.5 6-9.75 6s-8.25-3.333-9.75-6z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </>
                      )}
                    </svg>
                    <span>{isPublished ? 'หน้า Public' : 'ตัวอย่าง'}</span>
                  </a>

                  {/* Edit */}
                  <button
                    onClick={() => onEdit(article)}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                    title="แก้ไข"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 5.487l1.651-1.651a1.875 1.875 0 112.652 2.652L7.125 20.526H3.75v-3.375L16.862 5.487z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25L16.5 5.25" />
                    </svg>
                    <span>แก้ไข</span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(article)}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-200"
                    title="ลบ"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75v9m4.5-9v9M5.25 6.75h13.5M18 6.75L17.115 19.125a1.875 1.875 0 01-1.872 1.625H8.757a1.875 1.875 0 01-1.872-1.625L6 6.75m3-3h6a1.125 1.125 0 011.125 1.125V6.75H7.875V4.875A1.125 1.125 0 019 3.75z" />
                    </svg>
                    <span>ลบ</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons - Desktop (Full buttons) */}
              <div className="hidden md:flex flex-col gap-2 flex-1">
                {/* Toggle Publish */}
                <button
                  onClick={() => onTogglePublish(article)}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isPublished
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isPublished ? 'ยกเลิกเผยแพร่' : 'เผยแพร่'}
                </button>

                {/* Preview/View Public */}
                <a
                  href={`/articles/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2"
                >
                  {isPublished ? 'ดูหน้า Public' : 'ดูตัวอย่าง'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    {isPublished ? (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h19.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c2.625 2.768 4.125 6.626 4.125 8.25s-1.5 5.482-4.125 8.25m0-16.5c-2.625 2.768-4.125 6.626-4.125 8.25s1.5 5.482 4.125 8.25" />
                      </>
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c1.5-2.667 4.5-6 9.75-6s8.25 3.333 9.75 6c-1.5 2.667-4.5 6-9.75 6s-8.25-3.333-9.75-6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </>
                    )}
                  </svg>
                </a>

                {/* Edit */}
                <button
                  onClick={() => onEdit(article)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  แก้ไข
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDelete(article)}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </article>
      );
      })}
    </div>
  );
}
