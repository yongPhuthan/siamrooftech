'use client';

import { useEffect, useCallback } from 'react';
import { Close as CloseIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { ProjectVideo } from '../../lib/firestore';
import VideoPlayer from './VideoPlayer';
import { getVideoTypeBadge } from '../../lib/project-video-utils';

interface VideoModalProps {
  isOpen: boolean;
  videos: ProjectVideo[];
  currentIndex: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function VideoModal({
  isOpen,
  videos,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}: VideoModalProps) {
  const currentVideo = videos[currentIndex];
  const hasMultipleVideos = videos.length > 1;
  const typeBadge = currentVideo ? getVideoTypeBadge(currentVideo.type) : null;

  // Handle ESC key
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultipleVideos && onPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasMultipleVideos && onNext) {
        onNext();
      }
    },
    [isOpen, hasMultipleVideos, onClose, onNext, onPrevious]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentVideo) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button - Top Right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all shadow-lg"
        aria-label="ปิด"
      >
        <CloseIcon fontSize="large" />
      </button>

      {/* Video Info - Top Left (Desktop) */}
      <div className="hidden md:block absolute top-4 left-4 z-50 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full">
        {typeBadge && (
          <span className="mr-2 font-semibold">
            {typeBadge.emoji} {typeBadge.label}
          </span>
        )}
        {currentIndex + 1} / {videos.length}
      </div>

      {/* Navigation Buttons - Desktop */}
      {hasMultipleVideos && (
        <div className="hidden md:block">
          {/* Previous Button */}
          {onPrevious && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              className="absolute left-4 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all shadow-lg"
              aria-label="วีดีโอก่อนหน้า"
            >
              <ChevronLeftIcon fontSize="large" />
            </button>
          )}

          {/* Next Button */}
          {onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-4 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all shadow-lg"
              aria-label="วีดีโอถัดไป"
            >
              <ChevronRightIcon fontSize="large" />
            </button>
          )}
        </div>
      )}

      {/* Mobile Navigation - Bottom */}
      {hasMultipleVideos && (
        <div className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
          {onPrevious && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all shadow-lg"
              aria-label="วีดีโอก่อนหน้า"
            >
              <ChevronLeftIcon fontSize="medium" />
            </button>
          )}

          <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
            {currentIndex + 1} / {videos.length}
          </div>

          {onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all shadow-lg"
              aria-label="วีดีโอถัดไป"
            >
              <ChevronRightIcon fontSize="medium" />
            </button>
          )}
        </div>
      )}

      {/* Video Player Container */}
      <div
        className="relative w-full max-w-7xl mx-4 sm:mx-8"
        onClick={(e) => e.stopPropagation()}
      >
        <VideoPlayer
          video={currentVideo}
          autoPlay
          controls
          onEnded={() => {
            // Auto-play next video if available
            if (hasMultipleVideos && onNext && currentIndex < videos.length - 1) {
              onNext();
            }
          }}
        />

        {/* Video Title & Description - Below Video (Mobile) */}
        <div className="md:hidden mt-4 px-4">
          {currentVideo.title && (
            <h3 className="text-white text-base font-semibold mb-2">{currentVideo.title}</h3>
          )}
          {currentVideo.description && (
            <p className="text-white/80 text-sm">{currentVideo.description}</p>
          )}
        </div>
      </div>

      {/* Instructions - Bottom Right (Desktop) */}
      <div className="hidden md:block absolute bottom-4 right-4 z-50 bg-white/10 backdrop-blur-sm text-white/70 px-4 py-2 rounded-full text-xs">
        ESC: ปิด | ←/→: เปลี่ยนวีดีโอ | Space: เล่น/หยุด
      </div>

      {/* Mobile Instructions - Top (below close button) */}
      <div className="md:hidden absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-sm text-white/70 px-3 py-1.5 rounded-full text-xs text-center">
        แตะเพื่อเล่น/หยุด • ปัดซ้าย/ขวา
      </div>
    </div>
  );
}
