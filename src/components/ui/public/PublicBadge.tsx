import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type PublicBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'brand' | 'inverse';
};

const tones = {
  neutral: 'bg-site-subtle text-site-muted',
  brand: 'bg-site-brand-soft text-site-brand-strong',
  inverse: 'bg-site-overlay text-white backdrop-blur-sm',
} as const;

export function PublicBadge({ tone = 'neutral', className, ...props }: PublicBadgeProps) {
  return <span className={cn('inline-flex items-center rounded-site-badge px-3 py-1 text-xs font-semibold', tones[tone], className)} {...props} />;
}
