'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '../../../lib/firestore';

interface PortfolioFiltersProps {
  projects: Project[];
  activeCategory?: string;
}

export default function PortfolioFilters({ projects, activeCategory = 'ทั้งหมด' }: PortfolioFiltersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Group projects by category
  const groupedProjects = projects.reduce((acc, project) => {
    const category = project.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const categories = [
    { name: 'ทั้งหมด', count: projects.length, href: '/portfolio' },
    ...Object.keys(groupedProjects).map(category => ({
      name: category,
      count: groupedProjects[category].length,
      href: `/portfolio/category/${encodeURIComponent(category)}`
    }))
  ];

  if (!mounted) {
    return (
      <div className="flex flex-wrap gap-3 justify-center">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Statistics */}
      <div className="text-center">
        <p className="text-gray-600 text-lg">
          แสดงผลงาน <span className="font-semibold text-gray-900">{projects.length}</span> โปรเจกต์
          {activeCategory !== 'ทั้งหมด' && (
            <span className="text-blue-600"> ในหมวด &quot;{activeCategory}&quot;</span>
          )}
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
        {categories.map((category, index) => {
          const isActive = category.name === activeCategory;
          
          return (
            <Link
              key={category.name}
              href={category.href}
              className={`
                group relative inline-flex items-center px-6 py-3 rounded-full font-medium text-sm
                transition-all duration-300 transform hover:scale-105
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                }
              `}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <span className="relative z-10">
                {category.name}
              </span>
              
              {/* Count badge */}
              <span 
                className={`
                  ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full
                  transition-colors duration-300
                  ${isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }
                `}
              >
                {category.count}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 opacity-90" />
              )}

              {/* Hover effect */}
              {!isActive && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {Object.entries(groupedProjects).slice(0, 4).map(([category, categoryProjects]) => (
          <div key={category} className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{categoryProjects.length}</div>
            <div className="text-sm text-gray-600 truncate">{category}</div>
          </div>
        ))}
      </div>
    </div>
  );
}