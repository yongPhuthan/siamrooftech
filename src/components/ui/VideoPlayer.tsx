'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowsOut, Pause, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react/dist/ssr';
import { PublicIcon } from '@/components/ui/public';
import type { ProjectVideo } from '@/features/projects/types';
import { getVideoTypeBadge } from '../../lib/project-video-utils';
import { formatVideoDuration } from '../../lib/cloudflare/uploadVideo';

interface VideoPlayerProps {
  video: ProjectVideo;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export default function VideoPlayer({
  video,
  autoPlay = false,
  muted = false,
  controls = true,
  className = '',
  onPlay,
  onPause,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);

  const typeBadge = getVideoTypeBadge(video.type);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      onPause?.();
    } else {
      videoRef.current.play();
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, onPause, onPlay]);

  // Handle mute/unmute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Update time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  // Handle ended
  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'ArrowRight':
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [duration, toggleFullscreen, toggleMute, togglePlay]);

  // Auto-hide controls on desktop
  useEffect(() => {
    if (!isPlaying) return;

    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  return (
    <div
      data-site-theme
      className={`relative group overflow-hidden rounded-site-media bg-black ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={video.thumbnail_url}
        preload="metadata"
        autoPlay={autoPlay}
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onClick={togglePlay}
      >
        <source src={video.video_url} type={video.mime_type || 'video/mp4'} />
        เบราว์เซอร์ของคุณไม่รองรับการเล่นวีดีโอ
      </video>

      {/* Type Badge - Top Left */}
      <div className="absolute top-3 left-3 z-20">
        <div
          className={`bg-${typeBadge.color}/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1`}
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
          <span>{typeBadge.label}</span>
        </div>
      </div>

      {/* Duration Badge - Top Right */}
      {duration > 0 && (
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white">
            {formatVideoDuration(duration)}
          </div>
        </div>
      )}

      {/* Play Overlay - Center (when paused) */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10 transition-all duration-300"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/95 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-200">
            <PublicIcon icon={Play} size={24} className="ml-1 text-site-ink sm:size-10" />
          </div>
        </div>
      )}

      {/* Custom Controls - Bottom */}
      {controls && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left: Play/Pause + Time */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors p-1"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                <PublicIcon icon={isPlaying ? Pause : Play} size={24} />
              </button>

              <span className="text-white text-xs sm:text-sm font-medium">
                {formatVideoDuration(currentTime)} / {formatVideoDuration(duration)}
              </span>
            </div>

            {/* Right: Mute + Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors p-1"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <PublicIcon icon={isMuted ? SpeakerSlash : SpeakerHigh} size={24} />
              </button>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-400 transition-colors p-1"
                aria-label="Fullscreen"
              >
                <PublicIcon icon={ArrowsOut} size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Overlay - Bottom Left (when paused, desktop only) */}
      {!isPlaying && video.title && (
        <div className="hidden md:block absolute bottom-4 left-4 z-10">
          <h3 className="text-white text-sm font-semibold drop-shadow-lg">{video.title}</h3>
          {video.description && (
            <p className="text-white/80 text-xs mt-1 max-w-md line-clamp-2">{video.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
