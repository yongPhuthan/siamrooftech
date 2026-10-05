import Link from 'next/link';
import { Phone } from '@phosphor-icons/react/dist/ssr';
import { PublicIcon } from '@/components/ui/public';

type FooterProps = {
  phonePosition?: string;
  showServiceLinks?: boolean;
};

export default function Footer({ phonePosition = 'footer', showServiceLinks = true }: FooterProps) {
  const serviceLinks = [
    { href: '/services/retractable-awning', label: 'กันสาดพับเก็บได้' },
    { href: '/services/electric-retractable-awning', label: 'กันสาดพับไฟฟ้า' },
    { href: '/services/retractable-awning/bangkok', label: 'กรุงเทพ' },
    { href: '/services/retractable-awning/nonthaburi', label: 'นนทบุรี' },
    { href: '/services/retractable-awning/pathum-thani', label: 'ปทุมธานี' },
  ];

  return (
    <footer data-site-theme className="bg-site-ink py-8 text-white">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        {showServiceLinks && (
          <nav aria-label="บริการหลัก" className="mb-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            {serviceLinks.map((link) => <Link key={link.href} href={link.href} className="text-slate-200 transition-colors hover:text-white">{link.label}</Link>)}
          </nav>
        )}
        <a href="tel:0984542455" data-analytics-type="phone" data-analytics-position={phonePosition} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-100 transition-colors hover:text-white">
          <PublicIcon icon={Phone} size={16} />098-454-2455
        </a>
        <p className="mb-2 text-sm">© {new Date().getFullYear()} Siamrooftech</p>
        <p className="text-xs text-slate-400">All rights reserved.</p>
      </div>
    </footer>
  );
}
