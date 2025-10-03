'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ProjectImage } from '@/lib/firestore';

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

  const currentImages = activeTab === 'after' ? afterImages : beforeImages;
  const currentLocalFiles = activeTab === 'after' ? localAfterFiles : localBeforeFiles;
  const setCurrentImages = activeTab === 'after' ? onAfterImagesChange : onBeforeImagesChange;
  const setCurrentLocalFiles = activeTab === 'after' ? onLocalAfterFilesChange : onLocalBeforeFilesChange;

  // Total count includes both uploaded images and local preview files
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
      <div className="flex items-center gap-2 border-b-2 border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('after')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 ${
            activeTab === 'after'
              ? 'border-b-4 border-green-500 text-green-700 bg-green-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="text-lg">🟢</span>
          <span>หลังติดตั้ง</span>
          <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
            {afterImages.length + localAfterFiles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('before')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 ${
            activeTab === 'before'
              ? 'border-b-4 border-red-500 text-red-700 bg-red-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="text-lg">🔴</span>
          <span>ก่อนติดตั้ง</span>
          <span className="text-sm bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
            {beforeImages.length + localBeforeFiles.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className={`p-6 rounded-xl border-2 ${
        activeTab === 'after'
          ? 'border-green-200 bg-gradient-to-br from-green-50 to-white'
          : 'border-red-200 bg-gradient-to-br from-red-50 to-white'
      }`}>
        {/* Instructions */}
        <div className={`mb-4 p-4 rounded-lg ${
          activeTab === 'after' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <p className={`text-sm font-medium ${
            activeTab === 'after' ? 'text-green-800' : 'text-red-800'
          }`}>
            {activeTab === 'after' ? (
              <>
                <strong>คำแนะนำ:</strong> อัพโหลดรูปหลังติดตั้งผลิตภัณฑ์ ควรมีอย่างน้อย 1 รูป
                เพื่อแสดงผลงานที่เสร็จสมบูรณ์
              </>
            ) : (
              <>
                <strong>คำแนะนำ:</strong> อัพโหลดรูปก่อนติดตั้ง (ถ้ามี)
                เพื่อแสดงการเปรียบเทียบแบบ Before/After ให้ลูกค้าเห็นความแตกต่าง
              </>
            )}
          </p>
          {activeTab === 'before' && beforeImages.length === 0 && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ ถ้าไม่มีรูปก่อนติดตั้ง ระบบจะใช้รูปแรกของ "หลังติดตั้ง" แสดงแทน
            </p>
          )}
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <label
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-200 ${
              activeTab === 'after'
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <p className="text-xs text-gray-500 mt-2">
            รองรับไฟล์: JPG, PNG, WebP (สูงสุด 5MB ต่อรูป)
          </p>
        </div>

        {/* Image Grid */}
        {totalCount > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">
                รูปทั้งหมด ({totalCount})
                {currentLocalFiles.length > 0 && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {currentLocalFiles.length} รอบันทึก
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-500">
                💡 ลากรูปเพื่อเรียงลำดับ
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Show uploaded images first */}
              {currentImages.map((image, index) => (
                <div
                  key={image.id || index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-move ${
                    draggedIndex === index
                      ? activeTab === 'after'
                        ? 'border-green-500 shadow-lg scale-105'
                        : 'border-red-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                    {/* Order Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold text-white ${
                      activeTab === 'after' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      #{index + 1}
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      title="ลบรูป"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Caption/Alt Text (if exists) */}
                  {(image.caption || image.alt_text) && (
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 line-clamp-2">
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
                  className="relative group rounded-lg overflow-hidden border-2 border-dashed border-blue-400 bg-blue-50/50 transition-all duration-200"
                >
                  {/* Preview Image */}
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={localFile.preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized // Required for blob URLs
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                    {/* Preview Badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold text-white bg-blue-500">
                      รอบันทึก
                    </div>

                    {/* Order Badge */}
                    <div className="absolute top-2 left-20 px-2 py-1 rounded-lg text-xs font-bold bg-white/90 text-gray-700">
                      #{currentImages.length + index + 1}
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLocalFile(localFile.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      title="ลบรูป"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* File Info */}
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-600 truncate">
                      {localFile.file.name}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {(localFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`text-center py-12 border-2 border-dashed rounded-xl ${
            activeTab === 'after'
              ? 'border-green-300 bg-green-50/50'
              : 'border-red-300 bg-red-50/50'
          }`}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              activeTab === 'after' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <svg className={`w-8 h-8 ${
                activeTab === 'after' ? 'text-green-500' : 'text-red-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">
              {activeTab === 'after' ? '⚠️ ยังไม่มีรูปหลังติดตั้ง' : 'ยังไม่มีรูปก่อนติดตั้ง'}
            </p>
            <p className="text-sm text-gray-500">
              {activeTab === 'after'
                ? 'กรุณาอัพโหลดรูปหลังติดตั้งอย่างน้อย 1 รูป'
                : 'คลิกปุ่มด้านบนเพื่ออัพโหลดรูป (ถ้ามี)'}
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
