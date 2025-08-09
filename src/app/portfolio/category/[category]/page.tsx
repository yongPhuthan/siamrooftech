import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { projectsAdminService } from '../../../../lib/firestore-admin';
import { Project } from '../../../../lib/firestore';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import PortfolioGrid from '../../../components/portfolio/PortfolioGrid';
import PortfolioFilters from '../../../components/portfolio/PortfolioFilters';
import FinalCTASection from '../../../components/FinalCTASection';

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

async function getProjectsByCategory(category: string): Promise<Project[]> {
  try {
    const decodedCategory = decodeURIComponent(category);
    return await projectsAdminService.getByCategory(decodedCategory);
  } catch (error) {
    console.error('Error fetching projects by category:', error);
    return [];
  }
}

export async function generateStaticParams() {
  try {
    const projects = await projectsAdminService.getAll();
    const categories = [...new Set(projects.map(p => p.category))];
    
    return categories.map((category) => ({
      category: encodeURIComponent(category),
    }));
  } catch (error) {
    console.error('Error generating static params for categories:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const projects = await getProjectsByCategory(category);
  
  if (projects.length === 0) {
    return {
      title: `ไม่พบผลงานในหมวด ${decodedCategory} - สยามรูฟเทค`,
      description: `ไม่พบผลงานในหมวด ${decodedCategory}`,
    };
  }

  const title = `ผลงาน${decodedCategory} - กันสาดพับเก็บได้ | สยามรูฟเทค`;
  const description = `ชมผลงานการติดตั้งกันสาดพับเก็บได้สำหรับ${decodedCategory} จากสยามรูฟเทค รวม ${projects.length} โปรเจกต์`;
  const keywords = `กันสาดพับเก็บได้, ${decodedCategory}, ติดตั้งกันสาด, สยามรูฟเทค`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": `https://siamrooftech.com/portfolio/category/${category}`,
    "about": {
      "@type": "Thing",
      "name": decodedCategory
    },
    "publisher": {
      "@type": "Organization",
      "name": "สยามรูฟเทค",
      "url": "https://siamrooftech.com"
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": projects.length,
      "itemListElement": projects.map((project, index) => ({
        "@type": "Product",
        "position": index + 1,
        "name": project.title,
        "description": Array.isArray(project.description) ? project.description.join(' ') : project.description,
        "image": project.featured_image || project.images?.[0]?.original_size,
        "url": `https://siamrooftech.com/portfolio/${project.slug || project.id}`,
        "category": project.category
      }))
    }
  };
  
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    other: {
      'application/ld+json': JSON.stringify(structuredData),
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const projects = await getProjectsByCategory(category);

  if (projects.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Breadcrumbs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs 
            items={[
              { name: 'หน้าแรก', href: '/' },
              { name: 'ผลงานทั้งหมด', href: '/portfolio' },
              { name: decodedCategory, href: `/portfolio/category/${category}` }
            ]} 
          />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              ผลงาน{decodedCategory}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              ผลงานการติดตั้ง
              <span className="block text-blue-600">กันสาดพับเก็บได้</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              ชมผลงานการติดตั้งกันสาดพับเก็บได้สำหรับ{decodedCategory}<br />
              จากสยามรูฟเทค รวม {projects.length} โปรเจกต์
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {projects.length} โปรเจกต์
              </div>
              <Link
                href="/portfolio"
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                ดูผลงานทั้งหมด
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PortfolioFilters projects={projects} activeCategory={decodedCategory} />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PortfolioGrid projects={projects} showLoadMore={false} />
      </div>

      {/* Navigation */}
      <div className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-10 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="text-center sm:text-left mb-8 sm:mb-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  สำรวจผลงานอื่นๆ
                </h2>
                <p className="text-lg text-gray-600">
                  ดูผลงานการติดตั้งกันสาดพับเก็บได้หลากหลายประเภทของเรา
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/portfolio"
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  ดูผลงานทั้งหมด
                </Link>
                <Link
                  href="/contact"
                  className="bg-white text-gray-700 px-8 py-3.5 rounded-xl font-medium hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  ขอใบเสนอราคา
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FinalCTASection 
        title="ต้องการกันสาดพับเก็บได้"
        subtitle={`สำหรับ${decodedCategory}ของคุณ?`}
      />
    </div>
  );
}