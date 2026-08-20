import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function ButtonLink({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
