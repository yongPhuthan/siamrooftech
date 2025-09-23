'use client';

import Link from 'next/link';

interface PortfolioButtonProps {
  className?: string;
  children: React.ReactNode;
}

const PortfolioButton = ({ className, children }: PortfolioButtonProps) => {
  return (
    <Link href="/portfolio" className="inline-block">
      <button className={className}>
        {children}
      </button>
    </Link>
  );
};

export default PortfolioButton;