'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Project, ProjectImage } from '@/lib/firestore';
import { Circle as CircleIcon } from '@mui/icons-material';

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

  const hasAfterImages = afterImages.length > 0;
  const hasBeforeImages = beforeImages.length > 0;

  return (
    <div className="space-y-8">
      {/* ===== After Section (Priority - Serial Position Effect) ===== */}
      {hasAfterImages && (
        <section className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-white rounded-2xl border-2 border-green-100 shadow-sm">
          {/* Header - Law of Proximity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="border-2 border-green-500 text-green-700 px-4 py-2 rounded-lg font-semibold text-sm bg-white flex items-center gap-2">
                <CircleIcon sx={{ fontSize: 16 }} className="text-green-600" />
                <span>หลังติดตั้ง</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {afterImages.length} รูป
              </span>
            </div>

            {/* Image counter */}
            <div className="bg-white px-3 py-1.5 rounded-full text-xs text-gray-600 border border-green-200">
              {activeAfterIndex + 1} / {afterImages.length}
            </div>
          </div>

          {/* Main Image */}
          <div
            className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-gray-100 group"
            onClick={() => onImageClick?.(afterImages[activeAfterIndex], activeAfterIndex, 'after')}
          >
            <Image
              src={afterImages[activeAfterIndex].original_size}
              alt={afterImages[activeAfterIndex].alt_text || `${project.title} - หลังติดตั้ง`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-gray-800">
                🔍 คลิกเพื่อดูขนาดใหญ่
              </div>
            </div>
          </div>

          {/* Thumbnails - Miller's Law: Max 8 visible */}
          {afterImages.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                รูปทั้งหมด
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {afterImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveAfterIndex(idx)}
                    className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                      activeAfterIndex === idx
                        ? 'ring-4 ring-green-500 shadow-lg scale-105'
                        : 'ring-2 ring-gray-200 hover:ring-green-300 hover:shadow-md'
                    }`}
                    style={{ width: 80, height: 80 }}
                    aria-label={`ดูรูปที่ ${idx + 1}`}
                  >
                    <Image
                      src={img.small_size || img.original_size}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />

                    {/* Active indicator */}
                    {activeAfterIndex === idx && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      </div>
                    )}

                    {/* Index badge */}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </div>
                  </button>
                ))}
              </div>
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
        <section className="space-y-4 p-6 bg-gradient-to-br from-red-50 to-white rounded-2xl border-2 border-red-100 shadow-sm">
          {/* Header - Law of Proximity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="border-2 border-red-500 text-red-700 px-4 py-2 rounded-lg font-semibold text-sm bg-white flex items-center gap-2">
                <CircleIcon sx={{ fontSize: 16 }} className="text-red-600" />
                <span>ก่อนติดตั้ง</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {beforeImages.length} รูป
              </span>
            </div>

            {/* Image counter */}
            <div className="bg-white px-3 py-1.5 rounded-full text-xs text-gray-600 border border-red-200">
              {activeBeforeIndex + 1} / {beforeImages.length}
            </div>
          </div>

          {/* Main Image */}
          <div
            className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-gray-100 group"
            onClick={() => onImageClick?.(beforeImages[activeBeforeIndex], activeBeforeIndex, 'before')}
          >
            <Image
              src={beforeImages[activeBeforeIndex].original_size}
              alt={beforeImages[activeBeforeIndex].alt_text || `${project.title} - ก่อนติดตั้ง`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-gray-800">
                🔍 คลิกเพื่อดูขนาดใหญ่
              </div>
            </div>
          </div>

          {/* Thumbnails - Miller's Law: Max 8 visible */}
          {beforeImages.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                รูปทั้งหมด
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {beforeImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveBeforeIndex(idx)}
                    className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                      activeBeforeIndex === idx
                        ? 'ring-4 ring-red-500 shadow-lg scale-105'
                        : 'ring-2 ring-gray-200 hover:ring-red-300 hover:shadow-md'
                    }`}
                    style={{ width: 80, height: 80 }}
                    aria-label={`ดูรูปที่ ${idx + 1}`}
                  >
                    <Image
                      src={img.small_size || img.original_size}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />

                    {/* Active indicator */}
                    {activeBeforeIndex === idx && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      </div>
                    )}

                    {/* Index badge */}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </div>
                  </button>
                ))}
              </div>
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
