'use client';

import Image from 'next/image';
import { trackLineClickMobile } from '@/lib/gtag';

interface LineButtonMobileProps {
  imageSrc?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  children?: React.ReactNode;
}

/**
 * LineButtonMobile - Mobile-only sticky bottom Line button
 *
 * Features:
 * - Fixed bottom full-width
 * - Height: 50px
 * - Background: #01b202 (green)
 * - Centered content
 * - Always visible on mobile
 */
export default function LineButtonMobile({
  imageSrc = '/images/line.png',
  imageAlt = 'Line Official',
  imageWidth = 28,
  imageHeight = 28,
  children = 'สอบถาม-ประเมินราคาฟรี'
}: LineButtonMobileProps) {
  const handleClick = () => {
    trackLineClickMobile();
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[9999] bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="p-2">
        <a
          href="https://lin.ee/pPz1ZqN"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex items-center justify-center gap-2 w-full h-[50px] bg-[#01b202] hover:bg-[#01bd00ff] active:bg-[#019001] rounded-lg transition-colors duration-200 shadow-md"
        >
          {imageSrc && (
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
              className="flex-shrink-0"
            />
          )}
          <span className="text-white text-base font-bold tracking-wide">
            {children}
          </span>
        </a>
      </div>
    </div>
  );
}
