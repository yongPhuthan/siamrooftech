'use client';

import Image from 'next/image';
import LineContactButton from './LineContactButton';
import { trackLineClickMobile } from '@/lib/gtag';

interface LineButtonMobileProps {
  compactCorners?: boolean;
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
  compactCorners = false,
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
    <div className="md:hidden fixed inset-x-0 bottom-0 z-[9999] w-screen max-w-full bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="w-full max-w-full p-2 pb-safe">
        {compactCorners ? (
          <LineContactButton analyticsPosition="mobile" fullWidth />
        ) : (
          <a
            href="https://lin.ee/pPz1ZqN"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="mx-auto flex h-[50px] w-full max-w-[calc(100vw-16px)] min-w-0 items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#01b202] px-4 shadow-md transition-colors duration-200 hover:bg-[#01bd00ff] active:bg-[#019001]"
          >
            {imageSrc && (
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={imageWidth}
                height={imageHeight}
                className="h-7 w-7 flex-shrink-0"
              />
            )}
            <span className="min-w-0 truncate text-center text-base font-bold tracking-wide text-white">
              {children}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
