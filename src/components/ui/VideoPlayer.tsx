'use client';

import { useState, useRef, useEffect } from 'react';
import { ProjectVideo } from '../../lib/firestore';
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
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      onPause?.();
    } else {
      videoRef.current.play();
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle mute/unmute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
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
  };

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
  }, [isPlaying, duration]);

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
      className={`relative group rounded-xl overflow-hidden bg-black ${className}`}
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
          <span>{typeBadge.emoji}</span>
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
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-gray-800 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
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
                {isPlaying ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
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
                {isMuted ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-400 transition-colors p-1"
                aria-label="Fullscreen"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
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
