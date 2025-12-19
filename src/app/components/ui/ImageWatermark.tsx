'use client';

import { Watermark } from 'antd';
import * as React from 'react';

type ImageWatermarkProps = {
  children: React.ReactNode;
  className?: string;
};

export default function ImageWatermark({ children, className }: ImageWatermarkProps) {
  return (
    <Watermark
      content="SiamRooftech"
      gap={[64, 64]}
      rotate={-22}
      zIndex={9999}
      width={140}
      height={64}
      font={{ color: 'rgba(255, 255, 255, 0.12)', fontSize: 14, fontWeight: 400 }}
      className={className ?? 'block w-full'}
      style={{ width: '100%' }}
    >
      {children}
    </Watermark>
  );
}
