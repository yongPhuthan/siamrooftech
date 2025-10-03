'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Project, ProjectImage } from '@/lib/firestore';
import BeforeAfterSlider from '../ui/BeforeAfterSlider';

interface BeforeAfterGalleryProps {
  project: Project;
  beforeImage: string;
  afterImages: ProjectImage[];
}

/**
 * BeforeAfterGallery - Complete Before/After showcase with thumbnail gallery
 *
 * Laws of UX Applied:
 * - Miller's Law: Limited thumbnails (max 8 visible)
 * - Fitts's Law: Large thumbnail targets (80px desktop, 64px mobile)
 * - Von Restorff Effect: Active thumbnail stands out
 * - Aesthetic-Usability: Clean layout with clear visual hierarchy
 */
export default function BeforeAfterGallery({
  project,
  beforeImage,
  afterImages,
}: BeforeAfterGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Get current after image for slider
  const currentAfterImage = afterImages[activeImageIndex]?.original_size || afterImages[0]?.original_size;

  if (!currentAfterImage) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">ไม่มีรูปภาพแสดง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Before/After Slider */}
      <BeforeAfterSlider
        beforeImage={beforeImage}
        afterImage={currentAfterImage}
        beforeAlt={`${project.title} - ก่อนติดตั้ง`}
        afterAlt={`${project.title} - หลังติดตั้ง - รูปที่ ${activeImageIndex + 1}`}
      />

      {/* Image Caption */}
      {afterImages[activeImageIndex]?.caption && (
        <p className="text-sm text-gray-600 text-center">
          {afterImages[activeImageIndex].caption}
        </p>
      )}

      {/* Image Counter */}
      <div className="text-center">
        <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
          รูปที่ {activeImageIndex + 1} / {afterImages.length}
        </span>
      </div>

      {/* Thumbnail Gallery */}
      {afterImages.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            รูปหลังติดตั้งทั้งหมด
          </h4>

          {/* Desktop: Horizontal scrollable row */}
          <div className="hidden md:block">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {afterImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setActiveImageIndex(index)}
                  className={`
                    relative flex-shrink-0 rounded-lg overflow-hidden
                    transition-all duration-200
                    ${
                      activeImageIndex === index
                        ? 'ring-4 ring-blue-500 shadow-xl scale-105'
                        : 'ring-2 ring-gray-200 hover:ring-blue-300 hover:shadow-lg'
                    }
                  `}
                  style={{ width: 80, height: 80 }}
                  aria-label={`ดูรูปที่ ${index + 1}`}
                  aria-current={activeImageIndex === index}
                >
                  <Image
                    src={image.small_size || image.original_size}
                    alt={image.alt_text || `รูปที่ ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />

                  {/* Active Indicator */}
                  {activeImageIndex === index && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="bg-white rounded-full p-1">
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Index Badge */}
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: Grid layout */}
          <div className="md:hidden">
            <div className="grid grid-cols-4 gap-2">
              {afterImages.slice(0, 8).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setActiveImageIndex(index)}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden
                    transition-all duration-200
                    ${
                      activeImageIndex === index
                        ? 'ring-3 ring-blue-500 shadow-lg scale-95'
                        : 'ring-2 ring-gray-200 active:scale-90'
                    }
                  `}
                  aria-label={`ดูรูปที่ ${index + 1}`}
                  aria-current={activeImageIndex === index}
                >
                  <Image
                    src={image.small_size || image.original_size}
                    alt={image.alt_text || `รูปที่ ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />

                  {/* Active Indicator */}
                  {activeImageIndex === index && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="bg-white rounded-full p-0.5">
                        <svg
                          className="w-3 h-3 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Index Badge */}
                  <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                    {index + 1}
                  </div>
                </button>
              ))}

              {/* Show More indicator */}
              {afterImages.length > 8 && (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-600 font-bold text-lg">
                      +{afterImages.length - 8}
                    </div>
                    <div className="text-gray-500 text-xs">รูป</div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: Show more button */}
            {afterImages.length > 8 && (
              <button
                className="w-full mt-2 text-center text-sm text-blue-600 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => {
                  // Could expand to show all thumbnails or open lightbox
                  console.log('Show all images');
                }}
              >
                ดูรูปทั้งหมด ({afterImages.length} รูป)
              </button>
            )}
          </div>

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
      )}
    </div>
  );
}
