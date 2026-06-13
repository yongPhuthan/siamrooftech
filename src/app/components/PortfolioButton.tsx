'use client';

import Link from 'next/link';
import { trackPortfolioButtonClick } from '@/lib/gtag';

interface PortfolioButtonProps {
  className?: string;
  children: React.ReactNode;
  position?: string;
}

const PortfolioButton = ({ className, children, position = 'unknown' }: PortfolioButtonProps) => {
  const handleClick = () => {
    trackPortfolioButtonClick(position);
  };

  return (
    <Link href="/portfolio" className="inline-block" onClick={handleClick}>
      <button className={className}>
        {children}
      </button>
    </Link>
  );
};

export default PortfolioButton;
