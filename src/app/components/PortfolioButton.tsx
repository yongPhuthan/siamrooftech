'use client';

import Link from 'next/link';
import { trackPortfolioButtonClick } from '@/lib/gtag';

interface PortfolioButtonProps {
  className?: string;
  children: React.ReactNode;
}

const PortfolioButton = ({ className, children }: PortfolioButtonProps) => {
  const handleClick = () => {
    trackPortfolioButtonClick();
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