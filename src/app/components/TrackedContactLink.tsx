'use client';

import { ReactNode } from 'react';
import { LINE_CONTACT_URL } from '@/features/line-contact/constants';
import { trackLineClick, trackPhoneClick } from '@/lib/gtag';

type TrackedContactLinkProps = {
  type: 'line' | 'phone';
  position: string;
  phoneNumber?: string;
  className?: string;
  children: ReactNode;
};

export default function TrackedContactLink({
  type,
  position,
  phoneNumber = '0984542455',
  className,
  children,
}: TrackedContactLinkProps) {
  const linkHref = type === 'phone' ? `tel:${phoneNumber}` : LINE_CONTACT_URL;

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
