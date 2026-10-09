import { Metadata } from 'next';
import Breadcrumbs from '@/components/site/Breadcrumbs';
import FinalCTASection from '@/components/site/FinalCTASection';
import ArticleCard from '@/app/components/articles/ArticleCard';
import { getPublishedArticles } from '@/features/articles/server/repository';
import { canonicalUrl } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'บทความและคำแนะนำ | Siamrooftech',
  description: 'ความรู้และคำแนะนำเกี่ยวกับการเลือก ติดตั้ง และดูแลกันสาด จาก Siamrooftech',
  alternates: { canonical: canonicalUrl('/articles') },
  openGraph: { title: 'บทความและคำแนะนำ | Siamrooftech', description: 'ความรู้และคำแนะนำเกี่ยวกับการเลือก ติดตั้ง และดูแลกันสาด', type: 'website', url: canonicalUrl('/articles') },
};

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  return (
    <div data-site-theme className="min-h-screen bg-site-canvas text-site-ink">
      <div className="border-b border-site-border bg-white"><Breadcrumbs items={[{ name: 'หน้าแรก', href: '/' }, { name: 'บทความ' }]} /></div>
      <header className="border-b border-site-border bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="heading-display font-bold">บทความและคำแนะนำ</h1>
          <p className="body-lead mx-auto mt-4 max-w-3xl text-site-muted">ข้อมูลและแนวทางเลือกใช้งานจากทีม Siamrooftech</p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {articles.length ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <ArticleCard key={article.articleId} article={article} />)}</div> : <p className="py-12 text-center text-site-muted">ยังไม่มีบทความที่เผยแพร่</p>}
      </main>
      <FinalCTASection title="มีคำถามเกี่ยวกับโครงการของคุณ" subtitle="ติดต่อทีมงานเพื่อรับคำแนะนำเพิ่มเติม" />
    </div>
  );
}
