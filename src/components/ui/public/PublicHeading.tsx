import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type PublicHeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  level?: 'display' | 'section' | 'panel';
};

const levels = {
  display: 'heading-display',
  section: 'heading-section',
  panel: 'heading-panel',
} as const;

export function PublicHeading({ as: Tag = 'h2', level = 'section', className, ...props }: PublicHeadingProps) {
  return <Tag className={cn(levels[level], className)} {...props} />;
}
