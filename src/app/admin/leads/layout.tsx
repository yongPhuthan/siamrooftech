import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { absolute: 'CRM ผู้ติดต่อ | Siamrooftech' },
  robots: { index: false, follow: false },
};

export default function LeadsLayout({ children }: { children: ReactNode }) {
  return children;
}
