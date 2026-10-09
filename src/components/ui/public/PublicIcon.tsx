import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type PublicIconSize = 16 | 20 | 24;

type PublicIconProps = {
  icon: Icon;
  size?: PublicIconSize;
  decorative?: boolean;
  className?: string;
};

const sizeClasses: Record<PublicIconSize, string> = {
  16: 'size-4',
  20: 'size-5',
  24: 'size-6',
};

export function PublicIcon({ icon: Icon, size = 20, decorative = true, className }: PublicIconProps) {
  return <Icon aria-hidden={decorative ? true : undefined} className={cn('shrink-0 text-current', sizeClasses[size], className)} weight="regular" />;
}
