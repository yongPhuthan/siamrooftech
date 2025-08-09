'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';

interface ProjectImage {
  id: string;
  title?: string;
  small_size?: string;
  original_size: string;
  alt_text?: string;
  caption?: string;
  type?: 'before' | 'during' | 'after' | 'detail';
}

interface PortfolioImageGalleryProps {
  images: ProjectImage[];
  projectTitle: string;
}

export default function PortfolioImageGallery({ images, projectTitle }: PortfolioImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(new Array(images.length).fill(false));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-medium">ไม่มีรูปภาพแสดง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative group">
        <div 
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 cursor-pointer"
          onClick={() => openLightbox(activeIndex)}
        >
          <Image
            src={images[activeIndex].original_size}
            alt={images[activeIndex].alt_text || `${projectTitle} - รูปที่ ${activeIndex + 1}`}
            fill
            priority
            className={`object-cover transition-all duration-500 hover:scale-105 ${
              imageLoaded[activeIndex] ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => handleImageLoad(activeIndex)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
          />
          
          {/* Loading skeleton */}
          {!imageLoaded[activeIndex] && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Zoom indicator */}
          <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
        
        {/* Image caption */}
        {images[activeIndex].caption && (
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            {images[activeIndex].caption}
          </p>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                activeIndex === index
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.small_size || image.original_size}
                alt={image.alt_text || `${projectTitle} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
              
              {/* Type indicator */}
              {image.type && (
                <div className={`absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded text-white font-medium ${
                  image.type === 'before' ? 'bg-red-500' :
                  image.type === 'during' ? 'bg-yellow-500' :
                  image.type === 'after' ? 'bg-green-500' :
                  'bg-blue-500'
                }`}>
                  {image.type === 'before' ? 'ก่อน' :
                   image.type === 'during' ? 'ระหว่าง' :
                   image.type === 'after' ? 'หลัง' : 'รายละเอียด'}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Image counter */}
      <div className="text-center text-sm text-gray-500">
        รูปที่ {activeIndex + 1} จาก {images.length} รูป
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors duration-200"
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors duration-200"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors duration-200"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main lightbox image */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].original_size}
              alt={images[lightboxIndex].alt_text || `${projectTitle} - รูปที่ ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {/* Image info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white">
            <div className="bg-black/70 px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium mb-1">
                {lightboxIndex + 1} / {images.length}
              </div>
              {images[lightboxIndex].caption && (
                <div className="text-xs text-gray-300 max-w-md">
                  {images[lightboxIndex].caption}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}