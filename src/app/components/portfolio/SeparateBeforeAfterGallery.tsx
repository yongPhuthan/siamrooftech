'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Project, ProjectImage } from '@/lib/firestore';
import { CheckCircleOutline, HourglassEmpty, RadioButtonUnchecked } from '@mui/icons-material';
import ImageWatermark from '../ui/ImageWatermark';

interface SeparateBeforeAfterGalleryProps {
  project: Project;
  afterImages: ProjectImage[];
  beforeImages: ProjectImage[];
  onImageClick?: (image: ProjectImage, index: number, type: 'before' | 'after') => void;
}

/**
 * SeparateBeforeAfterGallery - แยกแสดงรูป Before และ After เป็น 2 sections
 *
 * Laws of UX Applied:
 * - Serial Position Effect: แสดง After ก่อน (ผลลัพธ์สำคัญกว่า)
 * - Law of Proximity: จัดกลุ่ม Before/After แยกชัดเจน
 * - Law of Common Region: ใช้ background สีต่างกันเล็กน้อย
 * - Miller's Law: Max 8 thumbnails แสดงพร้อมกัน
 */
export default function SeparateBeforeAfterGallery({
  project,
  afterImages,
  beforeImages,
  onImageClick,
}: SeparateBeforeAfterGalleryProps) {
  const [activeAfterIndex, setActiveAfterIndex] = useState(0);
  const [activeBeforeIndex, setActiveBeforeIndex] = useState(0);
  const [isAfterImageLoading, setIsAfterImageLoading] = useState(false);
  const [isBeforeImageLoading, setIsBeforeImageLoading] = useState(false);

  const hasAfterImages = afterImages.length > 0;
  const hasBeforeImages = beforeImages.length > 0;

  return (
    <div className="space-y-6">
      {/* ===== After Section (Priority - Serial Position Effect) ===== */}
      {hasAfterImages && (
        <section className="space-y-4">
          {/* Header - Clean minimal style */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 mt-2">
            {/* Left side */}
            <div className="flex items-center gap-2">
              {/* <CheckCircleOutline className="text-green-500" style={{ fontSize: 22 }} /> */}
              <span className="text-sm font-medium text-gray-800">หลังติดตั้ง</span>
            </div>

            {/* Right side (counter) */}
            <div className="text-xs text-gray-500">
              {activeAfterIndex + 1} / {afterImages.length}
            </div>
          </div>

          {/* Main Image */}
          <ImageWatermark>
            <div
              className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-gray-100 group"
              onClick={() => onImageClick?.(afterImages[activeAfterIndex], activeAfterIndex, 'after')}
            >
              {/* Loading Spinner */}
              {isAfterImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                  </div>
                </div>
              )}

              <Image
                src={afterImages[activeAfterIndex].original_size}
                alt={afterImages[activeAfterIndex].alt_text || `${project.title} - หลังติดตั้ง`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onLoadingComplete={() => setIsAfterImageLoading(false)}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-gray-800">
                  🔍 คลิกเพื่อดูขนาดใหญ่
                </div>
              </div>
            </div>
          </ImageWatermark>

          {/* Thumbnails - Miller's Law: Max 8 visible */}
          {afterImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {afterImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => {
                    setIsAfterImageLoading(true);
                    setActiveAfterIndex(idx);
                  }}
                  className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${activeAfterIndex === idx
                    ? 'ring-2 ring-gray-900 shadow-md'
                    : 'ring-1 ring-gray-300 hover:ring-gray-400'
                    }`}
                  style={{ width: 72, height: 72 }}
                  aria-label={`ดูรูปที่ ${idx + 1}`}
                >
                  <Image
                    src={img.small_size || img.original_size}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />

                  {/* Active overlay */}
                  {activeAfterIndex === idx && (
                    <div className="absolute inset-0 bg-black/10" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Caption (if available) */}
          {afterImages[activeAfterIndex]?.caption && (
            <p className="text-sm text-gray-600 text-center italic">
              {afterImages[activeAfterIndex].caption}
            </p>
          )}
        </section>
      )}

      {/* ===== Before Section ===== */}
      {hasBeforeImages && (
        <section className="space-y-4">
          {/* Header - Clean minimal style */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            {/* Left side */}
            <div className="flex items-center gap-2">
              {/* <HourglassEmpty className="text-gray-400" style={{ fontSize: 22 }} /> */}
              <span className="text-sm font-medium text-gray-800">ก่อนติดตั้ง</span>
            </div>

            {/* Right side (counter) */}
            <div className="text-xs text-gray-500">
              {activeBeforeIndex + 1} / {beforeImages.length}
            </div>
          </div>

          {/* Main Image */}
          <ImageWatermark>
            <div
              className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-gray-100 group"
              onClick={() => onImageClick?.(beforeImages[activeBeforeIndex], activeBeforeIndex, 'before')}
            >
              {/* Loading Spinner */}
              {isBeforeImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                  </div>
                </div>
              )}

              <Image
                src={beforeImages[activeBeforeIndex].original_size}
                alt={beforeImages[activeBeforeIndex].alt_text || `${project.title} - ก่อนติดตั้ง`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onLoadingComplete={() => setIsBeforeImageLoading(false)}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-gray-800">
                  🔍 คลิกเพื่อดูขนาดใหญ่
                </div>
              </div>
            </div>
          </ImageWatermark>

          {/* Thumbnails - Miller's Law: Max 8 visible */}
          {beforeImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {beforeImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => {
                    setIsBeforeImageLoading(true);
                    setActiveBeforeIndex(idx);
                  }}
                  className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${activeBeforeIndex === idx
                    ? 'ring-2 ring-gray-900 shadow-md'
                    : 'ring-1 ring-gray-300 hover:ring-gray-400'
                    }`}
                  style={{ width: 72, height: 72 }}
                  aria-label={`ดูรูปที่ ${idx + 1}`}
                >
                  <Image
                    src={img.small_size || img.original_size}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />

                  {/* Active overlay */}
                  {activeBeforeIndex === idx && (
                    <div className="absolute inset-0 bg-black/10" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Caption (if available) */}
          {beforeImages[activeBeforeIndex]?.caption && (
            <p className="text-sm text-gray-600 text-center italic">
              {beforeImages[activeBeforeIndex].caption}
            </p>
          )}
        </section>
      )}

      {/* Empty State */}
      {!hasAfterImages && !hasBeforeImages && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
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
            </div>
            <p className="text-gray-600 font-medium">ไม่มีรูปภาพแสดง</p>
            <p className="text-sm text-gray-500">
              กรุณาอัพโหลดรูปภาพโปรเจคในหน้าจัดการ
            </p>
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
