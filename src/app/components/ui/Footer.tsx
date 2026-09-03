import Link from 'next/link';
import React from 'react'

type FooterProps = {
  /**
   * Analytics position for the phone link. AttributionCapture's document-level
   * listener picks it up from the data attributes, so this stays a server
   * component with no onClick handler.
   */
  phonePosition?: string;
  /**
   * Ad landing pages hide these, for the same reason the nav links are hidden:
   * a paid visitor should have no cheap exit off the conversion path.
   */
  showServiceLinks?: boolean;
};

function Footer({ phonePosition = 'footer', showServiceLinks = true }: FooterProps) {
  const serviceLinks = [
    { href: '/services/retractable-awning', label: 'กันสาดพับเก็บได้' },
    { href: '/services/electric-retractable-awning', label: 'กันสาดพับไฟฟ้า' },
    { href: '/services/retractable-awning/bangkok', label: 'กรุงเทพ' },
    { href: '/services/retractable-awning/nonthaburi', label: 'นนทบุรี' },
    { href: '/services/retractable-awning/pathum-thani', label: 'ปทุมธานี' },
  ];

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        {showServiceLinks && (
          <nav aria-label="บริการหลัก" className="mb-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            {serviceLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-200 transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <a
          href="tel:0984542455"
          data-analytics-type="phone"
          data-analytics-position={phonePosition}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-100 transition-colors hover:text-white"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          098-454-2455
        </a>
        <p className="text-sm mb-2">© {(new Date()).getFullYear()} Siamrooftech</p>
        <p className="text-xs text-gray-500">All rights reserved.</p>
      </div>
    </footer>
  );
}


export default Footer
