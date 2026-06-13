'use client';

import { ReactNode } from 'react';
import { trackLineClick, trackPhoneClick } from '@/lib/gtag';

type TrackedContactLinkProps = {
  type: 'line' | 'phone';
  position: string;
  href?: string;
  phoneNumber?: string;
  className?: string;
  children: ReactNode;
};

export default function TrackedContactLink({
  type,
  position,
  href,
  phoneNumber = '0984542455',
  className,
  children,
}: TrackedContactLinkProps) {
  const linkHref = href || (type === 'phone' ? `tel:${phoneNumber}` : 'https://lin.ee/pPz1ZqN');

  const handleClick = () => {
    if (type === 'phone') {
      trackPhoneClick(phoneNumber, position);
      return;
    }

    trackLineClick(position);
  };

  return (
    <a
      href={linkHref}
      target={type === 'line' ? '_blank' : undefined}
      rel={type === 'line' ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
