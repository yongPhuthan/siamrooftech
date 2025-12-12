'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PortfolioCard from './PortfolioCard';
import { Project } from '../../../lib/firestore';

interface PortfolioGridProps {
  projects: Project[];
  showLoadMore?: boolean;
  initialItemsPerPage?: number;
}

export default function PortfolioGrid({ 
  projects, 
  showLoadMore = false, 
  initialItemsPerPage = 12 
}: PortfolioGridProps) {
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (showLoadMore) {
      setDisplayedProjects(projects.slice(0, initialItemsPerPage));
    } else {
      setDisplayedProjects(projects);
    }
  }, [projects, showLoadMore, initialItemsPerPage]);

  const loadMore = async () => {
    setIsLoading(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * initialItemsPerPage;
    const endIndex = startIndex + initialItemsPerPage;
    const newProjects = projects.slice(startIndex, endIndex);
    
    setDisplayedProjects(prev => [...prev, ...newProjects]);
    setCurrentPage(nextPage);
    setIsLoading(false);
  };

  const hasMore = showLoadMore && displayedProjects.length < projects.length;

  if (!mounted) {
    return (
      <div className="space-y-8">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีผลงานในหมวดนี้</h3>
          <p className="text-gray-600 mb-6">กรุณาติดตามผลงานใหม่ๆ ของเราในอนาคต</p>
          <Link
            href="/portfolio"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ดูผลงานทั้งหมด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedProjects.map((project, index) => (
          <div
            key={project.id}
            className="opacity-0 animate-fade-in"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'forwards'
            }}
          >
            <PortfolioCard project={project} index={index} />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-8">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className={`
              inline-flex items-center px-8 py-4 bg-white border-2 border-gray-200 
              text-gray-700 font-medium rounded-xl hover:border-blue-600 hover:text-blue-600 
              transition-all duration-300 transform hover:scale-105 hover:shadow-lg
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังโหลด...
              </>
            ) : (
              <>
                <span>โหลดเพิ่มเติม</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({projects.length - displayedProjects.length} โปรเจกต์)
                </span>
                <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Results summary */}
      <div className="text-center text-gray-500 text-sm">
        แสดงผลงาน {displayedProjects.length} จาก {projects.length} โปรเจกต์
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
