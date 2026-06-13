import * as React from 'react';

type ImageWatermarkProps = {
  children: React.ReactNode;
  className?: string;
};

export default function ImageWatermark({ children, className }: ImageWatermarkProps) {
  return (
    <div className={`relative ${className ?? 'block w-full'}`}>
      {children}
      {/* Watermark Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='100' viewBox='0 0 140 100'%3E%3Ctext x='70' y='50' font-size='12' font-weight='700' font-family='sans-serif' fill='white' text-anchor='middle' transform='rotate(-22 70 50)'%3ESiamRooftech%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
