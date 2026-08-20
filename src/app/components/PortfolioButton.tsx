import Link from 'next/link';

interface PortfolioButtonProps {
  className?: string;
  children: React.ReactNode;
  position?: string;
}

const PortfolioButton = ({ className, children, position = 'unknown' }: PortfolioButtonProps) => {
  return (
    <Link
      href="/portfolio"
      className={`inline-flex items-center justify-center ${className || ''}`}
      data-analytics-position={position}
    >
      {children}
    </Link>
  );
};

export default PortfolioButton;
