'use client';

import Image from 'next/image';
import {
  trackLineClickHero,
  trackLineClickMiddle,
  trackLineClickBottom,
  trackLineClickMobile,
  trackLineClickDesktop
} from '@/lib/gtag';

type TrackingType = 'hero' | 'middle' | 'bottom' | 'mobile' | 'desktop';

interface LineButtonProps {
  className?: string;
  imageSrc: string;
  imageAlt: string;
  width: number;
  height: number;
  imageClassName?: string;
  children?: React.ReactNode;
  trackingType?: TrackingType;
}

const LineButton = ({ 
  className, 
  imageSrc, 
  imageAlt, 
  width, 
  height, 
  imageClassName,
  children,
  trackingType = 'hero' // default fallback
}: LineButtonProps) => {
  const handleClick = () => {
    // New tracking system based on button position
    switch (trackingType) {
      case 'hero':
        trackLineClickHero();
        break;
      case 'middle':
        trackLineClickMiddle();
        break;
      case 'bottom':
        trackLineClickBottom();
        break;
      case 'mobile':
        trackLineClickMobile();
        break;
      case 'desktop':
        trackLineClickDesktop();
        break;
      default:
        trackLineClickHero(); // fallback
    }
  };

  return (
    <a
      href="https://lin.ee/pPz1ZqN"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
      onClick={handleClick}
    >
      <button className={className}>
        {children}
        <Image
          alt={imageAlt}
          src={imageSrc}
          width={width}
          height={height}
          className={imageClassName}
        />
      </button>
    </a>
  );
};

export default LineButton;
