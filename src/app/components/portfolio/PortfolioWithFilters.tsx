'use client';

import { useCategories, useFilter, useFilteredProjects, usePortfolioStore } from '../../../store/portfolioStore';
import StaticPortfolioGrid from './StaticPortfolioGrid';

export default function PortfolioWithFilters() {
  const filteredProjects = useFilteredProjects();
  const categories = useCategories();
  const filter = useFilter();
  const { setFilter } = usePortfolioStore();

  const handleCategoryChange = (category: string) => {
    setFilter({ activeCategory: category });
  };

  return (
    <div className="space-y-8">

      {/* Category Filters - Chip Design */}
      <div className="space-y-6">


        {/* Filter Chips - Mobile Optimized */}
        <div className="relative">
          {/* Desktop: Centered flex-wrap layout */}
          <div className="hidden md:flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
            {categories.map((category, index) => {
              const isActive = category.name === filter.activeCategory;
              
              return (
                <button
                  key={`กันสาด${category.name}`}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`
                    group relative inline-flex items-center px-6 py-3 rounded-full font-medium text-sm
                    transition-all duration-300 transform hover:scale-105 chip-filter
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-600/20' 
                      : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 hover:shadow-md hover:text-blue-600'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <span className="relative z-10 font-medium">
                    {`กันสาด${category.name}`}
                  </span>
                  
                  {/* Count badge */}
                  <span 
                    className={`
                      ml-3 inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full
                      transition-all duration-300
                      ${isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }
                    `}
                  >
                    {category.count}
                  </span>

                  {/* Active glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 opacity-90 animate-pulse" 
                         style={{ animationDuration: '2s' }} />
                  )}

                  {/* Hover ripple effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              );
            })}
          </div>

          {/* Mobile: Horizontal scrollable chips */}
          <div className="md:hidden">
            {/* Scroll indicators */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
              
              {/* Scrollable container */}
              <div className="overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex gap-3 px-4 min-w-max">
                  {categories.map((category, index) => {
                    const isActive = category.name === filter.activeCategory;
                    
                    return (
                      <button
                        key={`mobile-กันสาด${category.name}`}
                        onClick={() => handleCategoryChange(category.name)}
                        className={`
                          group relative inline-flex items-center px-4 py-2.5 rounded-full font-medium text-sm
                          transition-all duration-300 chip-filter whitespace-nowrap
                          ${isActive 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                            : 'bg-white text-gray-700 border border-gray-200 active:scale-95'
                          }
                        `}
                        style={{
                          animationDelay: `${index * 30}ms`
                        }}
                      >
                        <span className="relative z-10 font-medium">
                          {category.name === 'ทั้งหมด' ? 'ทั้งหมด' : `กันสาด${category.name}`}
                        </span>
                        
                        {/* Count badge - smaller on mobile */}
                        <span 
                          className={`
                            ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full
                            transition-all duration-300
                            ${isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}
                        >
                          {category.count}
                        </span>

                        {/* Active glow effect */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 opacity-90" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Mobile scroll hint */}
            <div className="flex justify-center mt-3">
              <div className="flex items-center text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                <span>เลื่อนดูหมวดหมู่เพิ่มเติม</span>
                <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Category Stats */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {categories.slice(1, 5).map((category, index) => (
            <div 
              key={category.name} 
              className={`
                text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm
                transition-all duration-300 hover:shadow-md hover:border-blue-200
                stats-card cursor-pointer
                ${filter.activeCategory === category.name ? 'ring-2 ring-blue-500/20 border-blue-300' : ''}
              `}
              onClick={() => handleCategoryChange(category.name)}
              style={{
                animationDelay: `${(index + categories.length) * 50}ms`
              }}
            >
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {category.count}
              </div>
              <div className="text-sm text-gray-600 truncate font-medium">
                    {`กันสาด${category.name}`}
              </div>
              
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 rounded-full transition-all duration-500"
                  style={{ width: `${(category.count / (categories.find(c => c.name === 'ทั้งหมด')?.count || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div> */}
      </div>

      {/* Filtered Portfolio Grid */}
      <div className="transition-all duration-500 ease-in-out" key={`portfolio-${filter.activeCategory}-${filteredProjects.length}`}>
        <StaticPortfolioGrid projects={filteredProjects} />
      </div>

      <style jsx>{`
        @keyframes chip-fade-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .chip-filter {
          animation: chip-fade-in 0.4s ease-out var(--delay, 0ms) both;
        }
        
        .stats-card {
          animation: chip-fade-in 0.5s ease-out var(--delay, 0ms) both;
        }

        .chip-filter:active {
          transform: scale(0.95);
        }

        /* Enhance hover effects */
        .chip-filter:hover {
          box-shadow: 0 8px 25px -8px rgba(59, 130, 246, 0.3);
        }

        .stats-card:hover {
          transform: translateY(-2px);
        }

        /* Hide scrollbars for mobile chip container */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Smooth scrolling for mobile */
        .overflow-x-auto {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* Enhanced mobile touch feedback */
        @media (max-width: 768px) {
          .chip-filter:active {
            transform: scale(0.92);
            transition-duration: 0.1s;
          }
          
          .chip-filter {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }
        }
      `}</style>
    </div>
  );
}