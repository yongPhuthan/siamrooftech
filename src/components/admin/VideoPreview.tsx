'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ProjectVideo } from '../../lib/firestore';
import { getVideoTypeBadge } from '../../lib/project-video-utils';
import { formatVideoDuration, formatFileSize } from '../../lib/cloudflare/uploadVideo';

interface VideoPreviewProps {
  video: ProjectVideo;
  onDelete?: () => void;
  onTypeChange?: (type: 'before' | 'after' | 'during' | 'detail') => void;
  showControls?: boolean;
}

export default function VideoPreview({
  video,
  onDelete,
  onTypeChange,
  showControls = true,
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const typeBadge = getVideoTypeBadge(video.type);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all group">
      {/* Video Thumbnail/Preview */}
      <div className="relative aspect-video bg-gray-100">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2 z-10">
          <div
            className="px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1"
            style={{
              backgroundColor:
                typeBadge.color === 'red-500'
                  ? 'rgba(239, 68, 68, 0.9)'
                  : typeBadge.color === 'green-500'
                  ? 'rgba(34, 197, 94, 0.9)'
                  : typeBadge.color === 'yellow-500'
                  ? 'rgba(234, 179, 8, 0.9)'
                  : typeBadge.color === 'blue-500'
                  ? 'rgba(59, 130, 246, 0.9)'
                  : 'rgba(107, 114, 128, 0.9)',
            }}
          >
            <span>{typeBadge.emoji}</span>
            <span>{typeBadge.label}</span>
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white">
            {formatVideoDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{video.title}</h4>

        {/* File Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{video.mime_type?.split('/')[1]?.toUpperCase() || 'VIDEO'}</span>
          {video.file_size && <span>{formatFileSize(video.file_size)}</span>}
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {/* Type Selector */}
            {onTypeChange && (
              <select
                value={video.type || 'after'}
                onChange={(e) =>
                  onTypeChange(e.target.value as 'before' | 'after' | 'during' | 'detail')
                }
                className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="before">🕐 ก่อนติดตั้ง</option>
                <option value="after">✅ หลังติดตั้ง</option>
                <option value="during">🚧 ระหว่างติดตั้ง</option>
                <option value="detail">🔍 รายละเอียด</option>
              </select>
            )}

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showDeleteConfirm
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                {showDeleteConfirm ? 'ยืนยันลบ?' : 'ลบ'}
              </button>
            )}
          </div>
        )}

        {/* Description (if exists) */}
        {video.description && (
          <p className="text-xs text-gray-600 line-clamp-2 pt-1">{video.description}</p>
        )}
      </div>
    </div>
  );
}
