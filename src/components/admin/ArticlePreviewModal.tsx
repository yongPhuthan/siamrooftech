'use client';

import { ArticleBlock } from '@/lib/firestore';

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  blocks: ArticleBlock[];
  author: string;
  category: string;
}

export default function ArticlePreviewModal({
  isOpen,
  onClose,
  title,
  excerpt,
  blocks,
  author,
  category,
}: ArticlePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
            <h2 className="text-lg font-semibold text-gray-900">พรีวิวบทความ</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Article Preview Content - Matching article detail page style */}
          <article className="px-6 py-12">
            {/* Category Label */}
            <div className="mb-6">
              <span className="inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                {category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              {title || 'ไม่มีหัวข้อ'}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-10 pb-8 border-b border-gray-100">
              <span>{author}</span>
              <span className="text-gray-300">|</span>
              <time>{new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</time>
            </div>

            {/* Excerpt */}
            {excerpt && (
              <div className="text-lg text-gray-700 leading-relaxed mb-10 pl-4 border-l-2 border-gray-900">
                {excerpt}
              </div>
            )}

            {/* Blocks Content */}
            {blocks && blocks.length > 0 ? (
              <div className="space-y-8">
                {blocks.map((block, index) => (
                  <div key={block.id || index} className="space-y-4">
                    {/* Block Image */}
                    {block.image && (
                      <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                        <img
                          src={block.image}
                          alt={`รูปประกอบบล็อกที่ ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Block Content */}
                    {block.content && (
                      <div
                        className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                        style={{
                          fontSize: '1.125rem',
                          lineHeight: '1.8',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: block.content
                            // Simple Markdown parsing
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-gray-900 underline hover:text-gray-600 transition-colors">$1</a>')
                            .replace(/^### (.+)$/gm, '<h3 class="text-2xl font-bold text-gray-900 mt-10 mb-4">$1</h3>')
                            .replace(/^## (.+)$/gm, '<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">$1</h2>')
                            .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2">$1</li>')
                            .replace(/\n\n/g, '</p><p class="mb-6">')
                            .replace(/^(.+)$/gm, '<p class="mb-6 text-gray-700">$1</p>'),
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>ยังไม่มีเนื้อหาในบล็อก</p>
              </div>
            )}
          </article>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ปิดพรีวิว
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
