import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Project } from '../../lib/firestore';
import { projectsAdminService } from '../../lib/firestore-admin';
import FinalCTASection from '../components/FinalCTASection';

// Enable ISR with 60 seconds revalidation
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'ผลงานทั้งหมด - กันสาดพับเก็บได้ | สยามรูฟเทค',
  description: 'ชมผลงานการติดตั้งกันสาดพับเก็บได้ระบบมือหมุนและมอเตอร์ไฟฟ้าจากสยามรูฟเทค บริการติดตั้งมืออาชีพ คุณภาพสูง',
  keywords: 'ผลงาน กันสาด พับเก็บได้ ติดตั้ง สยามรูฟเทค',
  openGraph: {
    title: 'ผลงานทั้งหมด - กันสาดพับเก็บได้ | สยามรูฟเทค',
    description: 'ชมผลงานการติดตั้งกันสาดพับเก็บได้ระบบมือหมุนและมอเตอร์ไฟฟ้าจากสยามรูฟเทค',
    images: ['/images/works/project-showcase.jpg'],
  },
};

// Helper function to get unique categories from projects
function getUniqueCategories(projects: Project[]): string[] {
  const categories = projects.map(project => project.category);
  const uniqueCategories = [...new Set(categories)];
  return ['ทั้งหมด', ...uniqueCategories];
}

export default async function WorksPage() {
  let projects: Project[] = [];
  let categories: string[] = ['ทั้งหมด'];
  let hasError = false;
  
  try {
    projects = await projectsAdminService.getAll();
    categories = getUniqueCategories(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    hasError = true;
    // Projects will be empty array in case of error, 
    // but projectsAdminService.getAll() now returns fallback data automatically
    projects = [];
    categories = ['ทั้งหมด'];
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Breadcrumbs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs 
            items={[
              { name: 'หน้าแรก', href: '/' },
              { name: 'ผลงานทั้งหมด', href: '/works' }
            ]} 
          />
        </div>
      </div>

      {/* Error notification for development */}
      {hasError && process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  ⚠️ Development Mode: Using fallback data due to Firestore connection issue
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Simple Header */}
      <div className="bg-white py-12">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">ผลงานทั้งหมด</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ชมผลงานการติดตั้งกันสาดพับเก็บได้คุณภาพสูง
          </p>
        </div>
      </div>
     

      {/* Simple Filter Categories */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category, index) => (
              <button
                key={category}
                className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 ${
                  index === 0 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Gallery */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Link 
              key={project.id} 
              href={`/works/${project.id}`}
              className="group"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200">
                <div className="relative h-64 overflow-hidden bg-gray-50">
                  <Image
                    src={project.featured_image || project.images?.[0]?.original_size || '/images/default-project.jpg'}
                    alt={project.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                        {project.category}
                      </span>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium ml-2">
                        {project.type}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                    {Array.isArray(project.description) ? project.description.join(' ') : project.description}
                  </p>
                  
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <svg className="w-3.5 h-3.5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h4a1 1 0 011 1v2a1 1 0 01-1 1h-4v8a1 1 0 01-1 1H9a1 1 0 01-1-1v-8H4a1 1 0 01-1-1V8a1 1 0 011-1h4z" />
                          </svg>
                          ปี
                        </span>
                        <span className="font-medium text-gray-900">{project.year}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <svg className="w-3.5 h-3.5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          สถานที่
                        </span>
                        <span className="font-medium text-gray-900">{project.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <FinalCTASection />
    </div>
  );
}