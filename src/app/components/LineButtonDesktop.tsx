'use client';

import Image from 'next/image';
import { trackLineClickDesktop } from '@/lib/gtag';

interface LineButtonDesktopProps {
  imageSrc?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  children?: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left';
}

/**
 * LineButtonDesktop - Desktop-only floating Line button
 *
 * Features:
 * - Fixed position (bottom-right by default)
 * - Background: #01b202 (green)
 * - Rounded pill shape
 * - Hover effects
 * - Hidden on mobile
 */
export default function LineButtonDesktop({
  imageSrc = '/images/line.png',
  imageAlt = 'Line Official',
  imageWidth = 32,
  imageHeight = 32,
  children = 'สอบถาม-ประเมินราคาฟรี',
  position = 'bottom-right'
}: LineButtonDesktopProps) {
  const handleClick = () => {
    trackLineClickDesktop();

    // GTM conversion tracking
    if (typeof window !== 'undefined' && typeof (window as any).gtag_report_conversion === 'function') {
      (window as any).gtag_report_conversion('https://lin.ee/pPz1ZqN');
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  return (
    <div className={`hidden md:block fixed ${positionClasses[position]} z-40`}>
      <a
        href="https://lin.ee/pPz1ZqN"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group flex items-center gap-3 px-6 py-3 bg-[#01b202] hover:bg-[#01bd00ff] active:bg-[#019001] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
          />
        )}
        <span className="text-white text-base font-bold whitespace-nowrap">
          {children}
        </span>
      </a>
    </div>
  );
}
