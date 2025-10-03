'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
  initialPosition?: number; // 0-100, default 50
  onPositionChange?: (position: number) => void;
}

/**
 * BeforeAfterSlider - Interactive image comparison slider
 *
 * Laws of UX Applied:
 * - Fitts's Law: Large touch targets (48px handle on mobile)
 * - Doherty Threshold: < 16ms response time using RAF
 * - Jakob's Law: Familiar vertical divider pattern
 * - Aesthetic-Usability: Smooth animations & visual feedback
 */
export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt = 'ก่อนติดตั้ง',
  afterAlt = 'หลังติดตั้ง',
  className = '',
  initialPosition = 50,
  onPositionChange,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Update slider position with RAF for smooth 60fps
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;

    // Cancel previous RAF if exists
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule update with RAF (Doherty Threshold: < 16ms)
    rafRef.current = requestAnimationFrame(() => {
      setSliderPosition(percentage);
      onPositionChange?.(percentage);
    });
  }, [onPositionChange]);

  // Mouse events (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling while dragging
      updatePosition(e.touches[0].clientX);
    },
    [isDragging, updatePosition]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard events (Accessibility)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      let newPosition = sliderPosition;

      switch (e.key) {
        case 'ArrowLeft':
          newPosition = Math.max(0, sliderPosition - 5);
          break;
        case 'ArrowRight':
          newPosition = Math.min(100, sliderPosition + 5);
          break;
        case 'Home':
          newPosition = 0;
          break;
        case 'End':
          newPosition = 100;
          break;
        default:
          return;
      }

      e.preventDefault();
      setSliderPosition(newPosition);
      onPositionChange?.(newPosition);
    },
    [sliderPosition, onPositionChange]
  );

  // Setup event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 cursor-ew-resize select-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="slider"
      aria-label="เลื่อนเปรียบเทียบภาพก่อนและหลัง"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(sliderPosition)}
      tabIndex={0}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* After Badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-sm">
            หลังติดตั้ง
          </div>
        </div>
      </div>

      {/* Before Image (Overlay with clip) */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <Image
          src={beforeImage}
          alt={beforeAlt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Before Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-sm">
            ก่อนติดตั้ง
          </div>
        </div>
      </div>

      {/* Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Vertical Line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 shadow-lg" />

        {/* Drag Handle */}
        <div
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-10 h-10 sm:w-12 sm:h-12
            bg-white border-3 border-blue-500
            rounded-full shadow-xl
            flex items-center justify-center
            pointer-events-auto cursor-ew-resize
            transition-all duration-200
            ${isDragging ? 'scale-110 shadow-2xl' : ''}
            ${isHovered && !isDragging ? 'scale-105' : ''}
          `}
          style={{
            boxShadow: isDragging
              ? '0 8px 25px -8px rgba(59, 130, 246, 0.8)'
              : '0 4px 12px -4px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Double Arrow Icon */}
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M8 7l-5 5 5 5M16 7l5 5-5 5"
            />
          </svg>
        </div>
      </div>

      {/* Instruction Hint (show on first hover) */}
      {isHovered && !isDragging && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
          <div className="bg-black/70 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
            <span className="hidden sm:inline">← เลื่อนเพื่อเปรียบเทียบ →</span>
            <span className="sm:hidden">← ลากเพื่อดู →</span>
          </div>
        </div>
      )}

      {/* Loading States */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
