import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const publicActionLinkVariants = cva(
  'inline-flex min-h-11 items-center justify-center rounded-site-action px-5 py-3 text-center text-sm font-semibold transition-colors duration-180 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-focus focus-visible:ring-offset-2',
  {
    variants: {
      appearance: {
        brand: 'bg-site-brand text-white hover:bg-site-brand-strong',
        outline: 'border border-site-border bg-site-surface text-site-ink hover:border-site-brand hover:text-site-brand-strong',
        quiet: 'text-site-brand-strong hover:text-site-brand',
      },
      size: {
        default: 'min-h-11 px-5 py-3',
        compact: 'min-h-9 px-3 py-2 text-xs',
        landing: 'min-h-12 px-6 py-4 text-base',
      },
    },
    defaultVariants: { appearance: 'brand', size: 'default' },
  },
);

type PublicActionLinkProps = ComponentPropsWithoutRef<typeof Link> & VariantProps<typeof publicActionLinkVariants>;

export function PublicActionLink({ appearance = 'brand', className, ...props }: PublicActionLinkProps) {
  return <Link className={cn(publicActionLinkVariants({ appearance }), className)} {...props} />;
}
