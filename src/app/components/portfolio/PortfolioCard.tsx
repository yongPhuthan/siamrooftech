'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Project } from '../../../lib/firestore';
import { hasVideos } from '../../../lib/project-video-utils';

interface PortfolioCardProps {
  project: Project;
  index: number;
}

export default function PortfolioCard({ project, index }: PortfolioCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check if project has before/after images
  const hasBeforeImage = project.images?.some(img => img.type === 'before');
  const beforeImage = hasBeforeImage
    ? project.images?.find(img => img.type === 'before')?.original_size
    : project.images?.[0]?.original_size;
  const afterImage = project.featured_image || project.images?.[0]?.original_size;

  const shouldShowBeforeAfter = hasBeforeImage && beforeImage && afterImage;

  return (
    <Link
      href={`/portfolio/${project.slug || project.id}`}
      className="group block"
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div 
        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {shouldShowBeforeAfter ? (
            <>
              {/* After Image (Default) */}
              <Image
                src={afterImage || '/images/default-project.jpg'}
                alt={`${project.title} - หลังติดตั้ง`}
                fill
                className={`object-cover transition-all duration-700 ${
                  isHovered ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                } ${imageLoaded ? '' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Before Image (Hover) */}
              <Image
                src={beforeImage || '/images/default-project.jpg'}
                alt={`${project.title} - ก่อนติดตั้ง`}
                fill
                className={`object-cover transition-all duration-700 ${
                  isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Before/After Badge */}
              <div className="absolute top-3 right-3 z-10">
                <div className={`backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all duration-300 ${
                  isHovered
                    ? 'bg-red-500/95 text-white'
                    : 'bg-green-500/95 text-white'
                }`}>
                  {isHovered ? '🔴 ก่อน' : '🟢 หลัง'}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Regular Image (Backward Compatible) */}
              <Image
                src={project.featured_image || project.images?.[0]?.original_size || '/images/default-project.jpg'}
                alt={project.title}
                fill
                className={`object-cover transition-all duration-700 ${
                  isHovered ? 'scale-110' : 'scale-100'
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Image count badge */}
              <div className="absolute top-3 right-3">
                <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-800 shadow-sm">
                  {project.images?.length || 1} รูป
                </div>
              </div>
            </>
          )}

          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white">
              {project.category}
            </div>
          </div>

          {/* Video Badge - Bottom Left (if project has videos) */}
          {hasVideos(project) && (
            <div className="absolute bottom-3 left-3 z-10">
              <div className="bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1 shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>{project.videos?.length || 0} วีดีโอ</span>
              </div>
            </div>
          )}

          {/* Hover overlay */}
          <div
            className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Hover hint for Before/After */}
          {shouldShowBeforeAfter && (
            <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 transition-all duration-300 ${
              isHovered ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            }`}>
              <div className="bg-blue-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white whitespace-nowrap shadow-lg">
                ⚡ Hover เพื่อดูภาพก่อน
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Location and Type */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{project.location}</span>
            </div>
            <div className="text-gray-500 font-medium">
              {project.year}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {Array.isArray(project.description) 
              ? project.description[0] || ''
              : project.description || ''
            }
          </p>

          {/* System Type */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {project.type}
            </div>
            
            {/* View Project Link */}
            <div className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
              ดูรายละเอียด
              <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}