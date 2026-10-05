import { Metadata } from 'next';
import Breadcrumbs from '@/components/site/Breadcrumbs';
import { Article } from '../../lib/firestore';
import { articlesAdminService } from '../../lib/firestore-admin';
import FinalCTASection from '@/components/site/FinalCTASection';
import { canonicalUrl } from '@/lib/seo-config';
import ArticleCard from '../components/articles/ArticleCard';

export const metadata: Metadata = {
  title: 'บทความกันสาดพับได้ - เทคนิค คำแนะนำ การดูแล | Siamrooftech',
  description: 'อ่านบทความเกี่ยวกับกันสาดพับได้ เทคนิคการเลือก การติดตั้ง การดูแลรักษา และคำแนะนำจากผู้เชี่ยวชาญมากกว่า 10 ปี',
  keywords: 'กันสาดพับได้, บทความกันสาด, เทคนิค, การติดตั้ง, การดูแล, กันสาดพับเก็บได้',
  alternates: {
    canonical: canonicalUrl('/articles'),
  },
  openGraph: {
    title: 'บทความกันสาดพับได้ - เทคนิคและคำแนะนำ | Siamrooftech',
    description: 'ความรู้และเทคนิคจากผู้เชี่ยวชาญด้านกันสาดพับได้ เรื่องการเลือก การติดตั้ง และการดูแลรักษา',
    type: 'website',
    url: canonicalUrl('/articles'),
  },
};

// Helper function to get unique categories from articles
function getUniqueCategories(articles: Article[]): string[] {
  const categories = articles.map(article => article.category);
  const uniqueCategories = [...new Set(categories)];
  return ['ทั้งหมด', ...uniqueCategories];
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
    <div data-site-theme className="min-h-screen bg-gray-50 text-site-ink">
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
          {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
        </div>
      </div>

      <FinalCTASection 
        title="กันสาดพับเก็บได้
สำหรับโปรเจกต์ของคุณ"
        subtitle="ติดต่อเราเพื่อรับคำแนะนำจากผู้เชี่ยวชาญ"
      />
    </div>
  );
}
