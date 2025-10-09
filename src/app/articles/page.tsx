import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Article } from '../../lib/firestore';
import { articlesAdminService } from '../../lib/firestore-admin';
import FinalCTASection from '../components/FinalCTASection';

export const metadata: Metadata = {
  title: 'บทความกันสาดพับได้ - เทคนิค คำแนะนำ การดูแล | Siamrooftech',
  description: 'อ่านบทความเกี่ยวกับกันสาดพับได้ เทคนิคการเลือก การติดตั้ง การดูแลรักษา และคำแนะนำจากผู้เชี่ยวชาญมากกว่า 10 ปี',
  keywords: 'กันสาดพับได้, บทความกันสาด, เทคนิค, การติดตั้ง, การดูแล, กันสาดพับเก็บได้',
  openGraph: {
    title: 'บทความกันสาดพับได้ - เทคนิคและคำแนะนำ | Siamrooftech',
    description: 'ความรู้และเทคนิคจากผู้เชี่ยวชาญด้านกันสาดพับได้ เรื่องการเลือก การติดตั้ง และการดูแลรักษา',
    type: 'website',
    url: 'https://www.siamrooftech.com/articles',
  },
};

// Helper function to get unique categories from articles
function getUniqueCategories(articles: Article[]): string[] {
  const categories = articles.map(article => article.category);
  const uniqueCategories = [...new Set(categories)];
  return ['ทั้งหมด', ...uniqueCategories];
}

// Helper function to format Firebase timestamp
function formatDate(timestamp: any): string {
  if (!timestamp) return '';
  
  // Handle Firebase timestamp
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString('th-TH');
  }
  
  // Handle string date
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleDateString('th-TH');
  }
  
  // Handle Date object
  return new Date(timestamp).toLocaleDateString('th-TH');
}

export default async function ArticlesPage() {
  let articles: Article[] = [];
  let categories: string[] = ['ทั้งหมด'];

  try {
    const allArticles = await articlesAdminService.getAll();
    // ✅ FIX: Filter เฉพาะ published articles สำหรับ public page
    articles = allArticles.filter(article => article.isPublished === true);
    categories = getUniqueCategories(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    // Fallback to empty array if Firebase fails
    articles = [];
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs 
            items={[
              { name: 'หน้าแรก', href: '/' },
              { name: 'บทความ', href: '/articles' }
            ]} 
          />
        </div>
      </div>

      {/* Header - เปลี่ยนจากเขียวเป็นน้ำเงิน */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">บทความและคำแนะนำ</h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto">
              ความรู้และเทคนิคจากผู้เชี่ยวชาญด้านกันสาดพับเก็บได้
            </p>
          </div>
        </div>
      </div>

      {/* Filter Categories - เปลี่ยนเป็นสีน้ำเงินและ style แบบ Portfolio */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category, index) => (
              <button
                key={category}
                className="group relative inline-flex items-center px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 transform hover:scale-105 bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 shadow-sm"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="relative z-10 font-medium">
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug || article.id}`}
              className="group block"
            >
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Image
                  src={article.featured_image || '/images/default-article.jpg'}
                  alt={article.title}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-110"
                />
                {/* Category Badge - Top Left */}
                <div className="absolute top-3 left-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
                    {article.category}
                  </span>
                </div>
                {/* Read Time Badge - Top Right */}
                <div className="absolute top-3 right-3">
                  <span className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium text-gray-800 shadow-sm">
                    {article.read_time}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>

                {/* Meta: Author + Date */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                </div>

                {/* CTA */}
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
          ))}
        </div>
      </div>

      <FinalCTASection 
        title="สนใจบทความและคำแนะนำ"
        subtitle="เพิ่มเติมเกี่ยวกับกันสาดพับเก็บได้?"
      />
    </div>
  );
}