'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { ProjectImage } from '@/features/projects/types';

// Local file with preview (not yet uploaded)
export interface LocalImageFile {
  id: string;
  file: File;
  preview: string; // blob URL
  type: 'before' | 'after';
}

interface ImageUploadTabsProps {
  afterImages: ProjectImage[];
  beforeImages: ProjectImage[];
  localAfterFiles: LocalImageFile[];
  localBeforeFiles: LocalImageFile[];
  onAfterImagesChange: (images: ProjectImage[]) => void;
  onBeforeImagesChange: (images: ProjectImage[]) => void;
  onLocalAfterFilesChange: (files: LocalImageFile[]) => void;
  onLocalBeforeFilesChange: (files: LocalImageFile[]) => void;
  onImageDelete: (imageId: string, type: 'before' | 'after') => Promise<void>;
  onImageReorder: (images: ProjectImage[], type: 'before' | 'after') => Promise<void>;
  isUploading?: boolean;
}

type TabType = 'after' | 'before';

/**
 * ImageUploadTabs - Admin component for uploading Before/After images
 *
 * Laws of UX Applied:
 * - Law of Common Region: Separate tabs for Before/After
 * - Miller's Law: Show manageable number of images per tab
 * - Fitts's Law: Large drag targets and buttons
 * - Visual Hierarchy: Color coding (green/red) for quick recognition
 */
export default function ImageUploadTabs({
  afterImages,
  beforeImages,
  localAfterFiles,
  localBeforeFiles,
  onAfterImagesChange,
  onBeforeImagesChange,
  onLocalAfterFilesChange,
  onLocalBeforeFilesChange,
  onImageDelete,
  onImageReorder,
  isUploading = false,
}: ImageUploadTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('after');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Image tab logic
  const currentImages = activeTab === 'after' ? afterImages : beforeImages;
  const currentLocalFiles = activeTab === 'after' ? localAfterFiles : localBeforeFiles;
  const setCurrentImages = activeTab === 'after' ? onAfterImagesChange : onBeforeImagesChange;
  const setCurrentLocalFiles = activeTab === 'after' ? onLocalAfterFilesChange : onLocalBeforeFilesChange;

  // Total count
  const totalCount = currentImages.length + currentLocalFiles.length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newLocalFiles: LocalImageFile[] = Array.from(e.target.files).map(file => ({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        type: activeTab,
      }));

      // Add to local files state (not uploading yet)
      setCurrentLocalFiles([...currentLocalFiles, ...newLocalFiles]);
      e.target.value = ''; // Reset input
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...currentImages];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    // Update order_index
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      order_index: idx,
    }));

    setCurrentImages(reorderedImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      await onImageReorder(currentImages, activeTab);
    }
    setDraggedIndex(null);
  };

  const handleDelete = async (imageId: string) => {
    if (window.confirm('ต้องการลบรูปนี้หรือไม่?')) {
      await onImageDelete(imageId, activeTab);
    }
  };

  const handleDeleteLocalFile = (fileId: string) => {
    if (window.confirm('ต้องการลบรูปนี้หรือไม่?')) {
      // Find and revoke the blob URL to free memory
      const fileToDelete = currentLocalFiles.find(f => f.id === fileId);
      if (fileToDelete) {
        URL.revokeObjectURL(fileToDelete.preview);
      }

      // Remove from local files
      const updatedFiles = currentLocalFiles.filter(f => f.id !== fileId);
      setCurrentLocalFiles(updatedFiles);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('after')}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
            activeTab === 'after'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>หลังติดตั้ง</span>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
              {afterImages.length + localAfterFiles.length}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('before')}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
            activeTab === 'before'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>ก่อนติดตั้ง</span>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
              {beforeImages.length + localBeforeFiles.length}
            </span>
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6">
        {/* Instructions */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-medium text-gray-700">
            {activeTab === 'after' ? (
              <>
                <strong className="text-gray-900">คำแนะนำ:</strong> อัปโหลดรูปหลังติดตั้งอย่างน้อย 1 รูปเพื่อช่วยเล่าเรื่องผลงานของคุณให้ครบถ้วน
              </>
            ) : (
              <>
                <strong className="text-gray-900">คำแนะนำ:</strong> เพิ่มรูปก่อนติดตั้ง (ถ้ามี) เพื่อให้ลูกค้าเห็นความแตกต่างแบบ Before / After
              </>
            )}
          </p>
          {activeTab === 'before' && beforeImages.length === 0 && (
            <p className="mt-2 text-xs text-gray-500">
              หากไม่มีรูปก่อนติดตั้ง ระบบจะใช้รูปหลังติดตั้งแสดงแทนโดยอัตโนมัติ
            </p>
          )}
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <label
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:border-gray-400 hover:text-gray-900 sm:w-auto ${
              isUploading ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{isUploading ? 'กำลังอัพโหลด...' : `เพิ่มรูป${activeTab === 'after' ? 'หลัง' : 'ก่อน'}ติดตั้ง`}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-xs text-gray-500">รองรับไฟล์ JPG, PNG, WebP (สูงสุด 5MB ต่อรูป)</p>
        </div>

        {/* Image Grid */}
        {totalCount > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-semibold text-gray-700">
                รูปทั้งหมด ({totalCount})
                {currentLocalFiles.length > 0 && (
                  <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    {currentLocalFiles.length} รอบันทึก
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-500">
                💡 ลากรูปเพื่อเรียงลำดับ
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {/* Show uploaded images first */}
              {currentImages.map((image, index) => (
                <div
                  key={image.id || index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative cursor-move overflow-hidden rounded-2xl border transition-all duration-150 ${
                    draggedIndex === index ? 'border-gray-900 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow'
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={image.small_size || image.original_size}
                      alt={image.alt_text || `Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 transition-all duration-150 group-hover:bg-black/30" />

                    {/* Order Badge */}
                    <div
                      className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${
                        activeTab === 'after' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="absolute right-2 top-2 rounded-full border border-gray-200 bg-white/90 p-1.5 text-gray-600 opacity-0 shadow-sm transition-all duration-150 hover:text-gray-900 group-hover:opacity-100"
                      title="ลบรูป"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Caption/Alt Text (if exists) */}
                  {(image.caption || image.alt_text) && (
                    <div className="bg-white p-2">
                      <p className="line-clamp-2 text-xs text-gray-600">
                        {image.caption || image.alt_text}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Show local preview files (not yet uploaded) */}
              {currentLocalFiles.map((localFile, index) => (
                <div
                  key={localFile.id}
                  className="group relative overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50 transition-all duration-150 hover:border-gray-400"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={localFile.preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
                    />

                    <div className="absolute inset-0 bg-white/0 transition-all duration-150 group-hover:bg-white/40" />

                    <div className="absolute left-2 top-2 rounded-full bg-gray-800/80 px-2 py-1 text-xs font-semibold text-white">
                      รอบันทึก
                    </div>

                    <div className="absolute left-20 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700">
                      #{currentImages.length + index + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLocalFile(localFile.id)}
                      className="absolute right-2 top-2 rounded-full border border-gray-200 bg-white/90 p-1.5 text-gray-600 opacity-0 shadow-sm transition-all duration-150 hover:text-gray-900 group-hover:opacity-100"
                      title="ลบรูป"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-white p-2">
                    <p className="truncate text-xs text-gray-600">{localFile.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(localFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="text-lg">{activeTab === 'after' ? '📷' : '🗂️'}</span>
            </div>
            <p className="mb-1 text-sm font-medium text-gray-700">
              {activeTab === 'after' ? 'ยังไม่มีรูปหลังติดตั้ง' : 'ยังไม่มีรูปก่อนติดตั้ง'}
            </p>
            <p className="text-xs text-gray-500">
              {activeTab === 'after'
                ? 'อัปโหลดรูปหลังติดตั้งเพื่อแสดงผลงาน'
                : 'เพิ่มรูปก่อนติดตั้ง (ถ้ามี) เพื่อให้เห็นความแตกต่าง'}
            </p>
          </div>
        )}

        {/* Validation Warning */}
        {activeTab === 'after' && afterImages.length === 0 && localAfterFiles.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  ต้องมีรูปหลังติดตั้งอย่างน้อย 1 รูป
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  ระบบจะไม่สามารถบันทึกโปรเจคได้หากไม่มีรูปหลังติดตั้ง
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
