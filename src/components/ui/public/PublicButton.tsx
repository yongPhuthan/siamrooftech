import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const publicButtonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-site-action px-5 py-3 text-sm font-semibold transition-colors duration-180 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      appearance: {
        brand: 'bg-site-brand text-white hover:bg-site-brand-strong',
        outline: 'border border-site-border bg-site-surface text-site-ink hover:border-site-brand hover:text-site-brand',
        quiet: 'bg-transparent text-site-brand hover:bg-site-brand-soft',
        line: 'bg-site-line text-white hover:bg-site-line-strong',
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

type PublicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof publicButtonVariants>;

export function PublicButton({ appearance, className, ...props }: PublicButtonProps) {
  return <button className={cn(publicButtonVariants({ appearance }), className)} {...props} />;
}
