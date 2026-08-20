import Image from 'next/image';
import type { ReactNode } from 'react';

type TrackingType = 'hero' | 'middle' | 'bottom' | 'mobile' | 'desktop';

interface LineButtonProps {
  className?: string;
  imageSrc: string;
  imageAlt: string;
  width: number;
  height: number;
  imageClassName?: string;
  children?: ReactNode;
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
  return (
    <a
      href="https://lin.ee/pPz1ZqN"
      target="_blank"
      rel="noopener noreferrer"
      className={className || 'block w-full'}
      data-analytics-type="line"
      data-analytics-position={trackingType}
    >
      {children}
      <Image
        alt={imageAlt}
        src={imageSrc}
        width={width}
        height={height}
        className={`h-auto max-w-full ${imageClassName || ''}`}
      />
    </a>
  );
};

export default LineButton;
