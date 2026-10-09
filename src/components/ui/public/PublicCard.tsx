import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva('overflow-hidden rounded-site-card border border-site-border bg-site-surface shadow-site-card', {
  variants: {
    variant: {
      default: '',
      interactive: 'transition-shadow duration-[180ms] hover:shadow-site-card-hover',
      compact: 'rounded-site-card shadow-none',
      landing: 'rounded-site-media shadow-site-card',
    },
  },
  defaultVariants: { variant: 'default' },
});

type PublicCardProps = HTMLAttributes<HTMLElement> & VariantProps<typeof cardVariants>;

export function PublicCard({ variant, className, ...props }: PublicCardProps) {
  return (
    <article
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}
