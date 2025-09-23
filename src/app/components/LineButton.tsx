'use client';

import Image from 'next/image';

interface LineButtonProps {
  className?: string;
  imageSrc: string;
  imageAlt: string;
  width: number;
  height: number;
  imageClassName?: string;
  children?: React.ReactNode;
}

const LineButton = ({ 
  className, 
  imageSrc, 
  imageAlt, 
  width, 
  height, 
  imageClassName,
  children 
}: LineButtonProps) => {
  const handleClick = () => {
    // GTM conversion tracking
    if (typeof window !== 'undefined' && typeof (window as any).gtag_report_conversion === 'function') {
      return (window as any).gtag_report_conversion('https://lin.ee/pPz1ZqN');
    }
    return true;
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