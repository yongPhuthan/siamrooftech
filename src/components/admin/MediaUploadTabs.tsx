'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProjectImage, ProjectVideo } from '@/features/projects/types';
import VideoPreview from './VideoPreview';
import { validateVideoFile, generateVideoThumbnail, getVideoDuration } from '@/lib/cloudflare/uploadVideo';

// Local file with preview (not yet uploaded)
export interface LocalImageFile {
  id: string;
  file: File;
  preview: string; // blob URL
  type: 'before' | 'after';
}

// Local video file with preview (not yet uploaded)
export interface LocalVideoFile {
  id: string;
  file: File;
  preview: string; // blob URL for thumbnail
  type: 'before' | 'after' | 'during' | 'detail';
  duration?: number;
}

interface MediaUploadTabsProps {
  afterImages: ProjectImage[];
  beforeImages: ProjectImage[];
  localAfterFiles: LocalImageFile[];
  localBeforeFiles: LocalImageFile[];
  videos?: ProjectVideo[];
  localVideoFiles?: LocalVideoFile[];
  onAfterImagesChange: (images: ProjectImage[]) => void;
  onBeforeImagesChange: (images: ProjectImage[]) => void;
  onLocalAfterFilesChange: (files: LocalImageFile[]) => void;
  onLocalBeforeFilesChange: (files: LocalImageFile[]) => void;
  onVideosChange?: (videos: ProjectVideo[]) => void;
  onLocalVideoFilesChange?: (files: LocalVideoFile[]) => void;
  onImageDelete: (imageId: string, type: 'before' | 'after') => Promise<void>;
  onImageReorder: (images: ProjectImage[], type: 'before' | 'after') => Promise<void>;
  onVideoDelete?: (videoId: string) => Promise<void>;
  onVideoTypeChange?: (videoId: string, type: 'before' | 'after' | 'during' | 'detail') => void;
  isUploading?: boolean;
}

type TabType = 'after' | 'before' | 'videos';

/**
 * MediaUploadTabs - Admin component for uploading Images and Videos
 *
 * Mobile Best Practices Applied:
 * - Touch Target Size: Min 44x44px for all interactive elements
 * - Single Column Layout: 1 column on mobile for easier viewing
 * - Readable Text: Shortened labels, larger font sizes
 * - Visual Hierarchy: Clear spacing and color coding
 * - Progressive Disclosure: Collapsible instructions
 * - Thumb Zone: Important actions within easy reach
 */
export default function MediaUploadTabs({
  afterImages,
  beforeImages,
  localAfterFiles,
  localBeforeFiles,
  videos = [],
  localVideoFiles = [],
  onAfterImagesChange,
  onBeforeImagesChange,
  onLocalAfterFilesChange,
  onLocalBeforeFilesChange,
  onVideosChange,
  onLocalVideoFilesChange,
  onImageDelete,
  onImageReorder,
  onVideoDelete,
  onVideoTypeChange,
  isUploading = false,
}: MediaUploadTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('after');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Current tab data
  const currentImages = activeTab === 'after' ? afterImages : activeTab === 'before' ? beforeImages : [];
  const currentLocalFiles = activeTab === 'after' ? localAfterFiles : activeTab === 'before' ? localBeforeFiles : [];
  const setCurrentImages = activeTab === 'after' ? onAfterImagesChange : activeTab === 'before' ? onBeforeImagesChange : () => {};
  const setCurrentLocalFiles = activeTab === 'after' ? onLocalAfterFilesChange : activeTab === 'before' ? onLocalBeforeFilesChange : () => {};

  // Total count
  const totalCount = activeTab === 'videos'
    ? videos.length + localVideoFiles.length
    : currentImages.length + currentLocalFiles.length;

  // Handle image file select
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    // Check if uploading videos
    if (activeTab === 'videos') {
      await handleVideoFilesSelect(files);
    } else {
      // Handle image files
      const newLocalFiles: LocalImageFile[] = files.map(file => ({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        type: activeTab as 'before' | 'after',
      }));

      setCurrentLocalFiles([...currentLocalFiles, ...newLocalFiles]);
    }

    e.target.value = ''; // Reset input
  };

  // Handle video files select
  const handleVideoFilesSelect = async (files: File[]) => {
    if (!onLocalVideoFilesChange) return;

    setIsProcessingVideo(true);
    const newVideoFiles: LocalVideoFile[] = [];

    try {
      for (const file of files) {
        // Validate video
        const validation = validateVideoFile(file);
        if (!validation.valid) {
          alert(`${file.name}: ${validation.error}`);
          continue;
        }

        // Extract duration and thumbnail
        try {
          const duration = await getVideoDuration(file);
          const thumbnail = await generateVideoThumbnail(file);

          newVideoFiles.push({
            id: `local-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: thumbnail,
            type: 'after', // default
            duration,
          });
        } catch (error) {
          console.error('Error processing video:', file.name, error);
          alert(`ไม่สามารถประมวลผลวีดีโอ: ${file.name}`);
        }
      }

      // Add to state
      if (newVideoFiles.length > 0) {
        onLocalVideoFilesChange([...localVideoFiles, ...newVideoFiles]);
      }
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // Drag and drop handlers (for images only)
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
      await onImageReorder(currentImages, activeTab as 'before' | 'after');
    }
    setDraggedIndex(null);
  };

  // Delete handlers
  const handleDeleteImage = async (imageId: string) => {
    if (window.confirm('ต้องการลบรูปนี้หรือไม่?')) {
      await onImageDelete(imageId, activeTab as 'before' | 'after');
    }
  };

  const handleDeleteLocalFile = (fileId: string) => {
    if (window.confirm('ต้องการลบรูปนี้หรือไม่?')) {
      const fileToDelete = currentLocalFiles.find(f => f.id === fileId);
      if (fileToDelete) {
        URL.revokeObjectURL(fileToDelete.preview);
      }
      const updatedFiles = currentLocalFiles.filter(f => f.id !== fileId);
      setCurrentLocalFiles(updatedFiles);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (window.confirm('ต้องการลบวีดีโอนี้หรือไม่?')) {
      if (onVideoDelete) {
        await onVideoDelete(videoId);
      }
    }
  };

  const handleDeleteLocalVideo = (videoId: string) => {
    if (window.confirm('ต้องการลบวีดีโอนี้หรือไม่?') && onLocalVideoFilesChange) {
      const videoToDelete = localVideoFiles.find(v => v.id === videoId);
      if (videoToDelete) {
        URL.revokeObjectURL(videoToDelete.preview);
      }
      const updatedVideos = localVideoFiles.filter(v => v.id !== videoId);
      onLocalVideoFilesChange(updatedVideos);
    }
  };

  const handleVideoTypeChange = (videoId: string, type: 'before' | 'after' | 'during' | 'detail') => {
    // For uploaded videos
    const video = videos.find(v => v.id === videoId);
    if (video && onVideoTypeChange) {
      onVideoTypeChange(videoId, type);
    }

    // For local videos
    const localVideo = localVideoFiles.find(v => v.id === videoId);
    if (localVideo && onLocalVideoFilesChange) {
      const updatedVideos = localVideoFiles.map(v =>
        v.id === videoId ? { ...v, type } : v
      );
      onLocalVideoFilesChange(updatedVideos);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Tab Navigation - Mobile Optimized */}
      <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('after')}
          className={`flex-1 rounded-lg sm:rounded-xl px-2 sm:px-4 py-3 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-150 min-h-[44px] ${
            activeTab === 'after'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 active:bg-white/50'
          }`}
        >
          <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">รูปหลังติดตั้ง</span>
              <span className="sm:hidden">หลัง</span>
            </span>
            <span className="rounded-full bg-gray-200 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-gray-600 font-semibold">
              {afterImages.length + localAfterFiles.length}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('before')}
          className={`flex-1 rounded-lg sm:rounded-xl px-2 sm:px-4 py-3 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-150 min-h-[44px] ${
            activeTab === 'before'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 active:bg-white/50'
          }`}
        >
          <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500" />
              <span className="hidden sm:inline">รูปก่อนติดตั้ง</span>
              <span className="sm:hidden">ก่อน</span>
            </span>
            <span className="rounded-full bg-gray-200 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-gray-600 font-semibold">
              {beforeImages.length + localBeforeFiles.length}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('videos')}
          className={`flex-1 rounded-lg sm:rounded-xl px-2 sm:px-4 py-3 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-150 min-h-[44px] ${
            activeTab === 'videos'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 active:bg-white/50'
          }`}
        >
          <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>วีดีโอ</span>
            </span>
            <span className="rounded-full bg-gray-200 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-gray-600 font-semibold">
              {videos.length + localVideoFiles.length}
            </span>
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-3 sm:p-6">
        {/* Collapsible Instructions - Mobile Optimized */}
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full mb-3 sm:mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors hover:bg-gray-100 active:bg-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">💡</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900">คำแนะนำ</span>
            </div>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showInstructions && (
          <div className="mb-3 sm:mb-4 rounded-xl border border-blue-100 bg-blue-50 px-3 sm:px-4 py-2.5 sm:py-3">
            <p className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">
              {activeTab === 'after' ? (
                <>อัปโหลดรูปหลังติดตั้งอย่างน้อย 1 รูป เพื่อแสดงผลงาน</>
              ) : activeTab === 'before' ? (
                <>เพิ่มรูปก่อนติดตั้ง (ถ้ามี) เพื่อให้เห็นความแตกต่าง</>
              ) : (
                <>
                  อัปโหลดวีดีโอผลงาน (MP4, WebM, MOV)
                  <span className="block mt-1 text-[11px] sm:text-xs text-gray-600">
                    • สูงสุด 100MB • ความยาว 15-60 วินาที • ความละเอียด 720p-1080p
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Upload Button - Mobile Optimized with min 44px touch target */}
        <div className="mb-4 sm:mb-6">
          <label
            className={`flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 sm:px-6 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-blue-700 transition-all duration-200 min-h-[48px] sm:min-h-[52px] ${
              isUploading || isProcessingVideo
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-blue-100 hover:border-blue-400 active:scale-[0.98]'
            }`}
          >
            {isProcessingVideo || isUploading ? (
              <>
                <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm sm:text-base">
                  {isProcessingVideo ? 'กำลังประมวลผล...' : 'กำลังอัพโหลด...'}
                </span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm sm:text-base">
                  {activeTab === 'videos'
                    ? 'อัปโหลดวีดีโอ'
                    : `อัปโหลดรูป${activeTab === 'after' ? 'หลัง' : 'ก่อน'}ติดตั้ง`}
                </span>
              </>
            )}
            <input
              type="file"
              multiple
              accept={activeTab === 'videos' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
              onChange={handleFileSelect}
              disabled={isUploading || isProcessingVideo}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-[11px] sm:text-xs text-gray-500 text-center">
            {activeTab === 'videos'
              ? '📹 MP4, WebM, MOV (สูงสุด 100MB)'
              : '📷 JPG, PNG, WebP (สูงสุด 5MB)'}
          </p>
        </div>

        {/* Content Grid */}
        {activeTab === 'videos' ? (
          /* Video Grid - Mobile First */
          totalCount > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-semibold text-gray-800">
                  วีดีโอทั้งหมด ({totalCount})
                </h4>
                {localVideoFiles.length > 0 && (
                  <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {localVideoFiles.length} รอบันทึก
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Uploaded videos */}
                {videos.map((video) => (
                  <VideoPreview
                    key={video.id}
                    video={video}
                    onDelete={() => handleDeleteVideo(video.id)}
                    onTypeChange={(type) => handleVideoTypeChange(video.id, type)}
                    showControls
                  />
                ))}

                {/* Local video previews - Mobile Optimized */}
                {localVideoFiles.map((localVideo) => (
                  <div key={localVideo.id} className="relative">
                    <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-dashed border-blue-300 overflow-hidden shadow-sm">
                      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                        <Image
                          src={localVideo.preview}
                          alt="Video thumbnail"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold shadow-md">
                          รอบันทึก
                        </div>
                        {localVideo.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-medium">
                            {Math.floor(localVideo.duration)}s
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={localVideo.file.name}>
                          {localVideo.file.name}
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <select
                            value={localVideo.type}
                            onChange={(e) => handleVideoTypeChange(localVideo.id, e.target.value as any)}
                            className="w-full sm:flex-1 text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-[40px]"
                          >
                            <option value="before">🕐 ก่อนติดตั้ง</option>
                            <option value="after">✅ หลังติดตั้ง</option>
                            <option value="during">🚧 ระหว่างติดตั้ง</option>
                            <option value="detail">🔍 รายละเอียด</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteLocalVideo(localVideo.id)}
                            className="w-full sm:w-auto bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 font-semibold px-4 py-2.5 rounded-lg text-xs sm:text-sm transition-colors min-h-[44px] sm:min-h-[40px]"
                          >
                            🗑️ ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm sm:text-base font-medium">ยังไม่มีวีดีโอ</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">กดปุ่มด้านบนเพื่ออัปโหลดวีดีโอผลงาน</p>
            </div>
          )
        ) : (
          /* Image Grid - Mobile First */
          totalCount > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm sm:text-base font-semibold text-gray-800">
                  รูปทั้งหมด ({totalCount})
                </h4>
                <div className="flex items-center gap-2">
                  {currentLocalFiles.length > 0 && (
                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {currentLocalFiles.length} รอบันทึก
                    </span>
                  )}
                  <p className="hidden sm:block text-xs text-gray-500">💡 ลากรูปเพื่อเรียงลำดับ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {/* Uploaded images - Mobile Optimized */}
                {currentImages.map((image, index) => (
                  <div
                    key={image.id || index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border transition-all duration-200 ${
                      draggedIndex === index
                        ? 'border-blue-500 shadow-lg ring-2 ring-blue-300'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md active:border-blue-400'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image
                        src={image.small_size || image.original_size}
                        alt={image.alt_text || `Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {/* Order Badge */}
                      <div className={`absolute top-2 left-2 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold shadow-md ${
                        activeTab === 'after'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    {/* Delete Button - Always visible on mobile, hover on desktop */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white p-2 sm:p-2.5 rounded-full shadow-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="ลบรูป"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Local image previews - Mobile Optimized */}
                {currentLocalFiles.map((localFile) => (
                  <div
                    key={localFile.id}
                    className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/30"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image
                        src={localFile.preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold shadow-md">
                        รอบันทึก
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-[10px] sm:text-xs font-medium">
                        {(localFile.file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    {/* Delete Button - Always visible on mobile */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLocalFile(localFile.id);
                      }}
                      className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white p-2 sm:p-2.5 rounded-full shadow-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="ลบรูป"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm sm:text-base font-medium">ยังไม่มีรูปภาพ</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">กดปุ่มด้านบนเพื่ออัปโหลดรูป{activeTab === 'after' ? 'หลัง' : 'ก่อน'}ติดตั้ง</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
