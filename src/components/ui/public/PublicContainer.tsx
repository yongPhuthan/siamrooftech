import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type PublicContainerProps = HTMLAttributes<HTMLDivElement> & {
  width?: 'content' | 'page' | 'wide';
};

const widths = {
  content: 'max-w-3xl',
  page: 'max-w-6xl',
  wide: 'max-w-7xl',
} as const;

export function PublicContainer({ className, width = 'page', ...props }: PublicContainerProps) {
  return <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widths[width], className)} {...props} />;
}
