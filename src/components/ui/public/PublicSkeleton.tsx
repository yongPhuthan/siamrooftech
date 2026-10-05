import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function PublicSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-site-card bg-site-subtle', className)} {...props} />;
}
