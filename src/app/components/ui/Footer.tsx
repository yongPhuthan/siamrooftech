import Link from 'next/link';
import React from 'react'

function Footer() {
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
        <nav aria-label="บริการหลัก" className="mb-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
          {serviceLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-gray-200 transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm mb-2">© {(new Date()).getFullYear()} Siamrooftech</p>
        <p className="text-xs text-gray-500">All rights reserved.</p>
      </div>
    </footer>
  );
}


export default Footer
