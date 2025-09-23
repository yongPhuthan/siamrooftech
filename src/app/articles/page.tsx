import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Article } from '../../lib/firestore';
import { articlesAdminService } from '../../lib/firestore-admin';
import FinalCTASection from '../components/FinalCTASection';

export const metadata: Metadata = {
  title: 'บทความ - เทคนิคและคำแนะนำกันสาดพับเก็บได้ | สยามรูฟเทค',
  description: 'อ่านบทความเกี่ยวกับกันสาดพับเก็บได้ เทคนิคการติดตั้ง การดูแลรักษา และคำแนะนำจากผู้เชี่ยวชาญ',
  keywords: 'บทความ กันสาด พับเก็บได้ เทคนิค การติดตั้ง การดูแลรักษา',
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
    articles = await articlesAdminService.getAll();
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

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">บทความและคำแนะนำ</h1>
            <p className="text-xl lg:text-2xl text-green-100 max-w-3xl mx-auto">
              ความรู้และเทคนิคจากผู้เชี่ยวชาญด้านกันสาดพับเก็บได้
            </p>
          </div>
        </div>
      </div>

      {/* Filter Categories */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className="px-6 py-2 rounded-full border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors duration-200 font-medium"
              >
                {category}
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
              className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={article.featured_image || '/images/default-article.jpg'}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {article.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                  <span className="text-green-600 font-medium">{article.read_time}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-green-600 font-medium group-hover:text-green-700 flex items-center">
                    อ่านต่อ
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
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