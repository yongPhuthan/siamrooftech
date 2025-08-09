'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'หน้าแรก', href: '/' },
    { name: 'ผลงาน', href: '/portfolio' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/portfolio') {
      return pathname.startsWith('/portfolio') || pathname.startsWith('/works');
    }
    return pathname === href;
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 lg:h-24">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex-shrink-0 hidden sm:block">
                <Image
                  src="/images/logo/IMG_1149.jpg"
                  alt="Siamrooftech Logo กันสาดพับเก็บได้"
                  width={80}
                  height={80}
                  className="object-contain rounded-lg"
                  style={{ 
                    width: 'clamp(64px, 5vw, 80px)', 
                    height: 'clamp(64px, 5vw, 80px)',
                    minWidth: '100px',
                    minHeight: '100px'
                  }}
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold text-[#002573]">สยามรูฟเทค</span>
                <span className="text-xs lg:text-sm text-gray-600 hidden sm:block">กันสาดพับเก็บได้</span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* CTA Button */}
            <div className="ml-4 pl-4 border-l border-gray-200">
              <a
                href="https://lin.ee/pPz1ZqN"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                onClick={() => {
                  if (typeof gtag_report_conversion === 'function') {
                    return gtag_report_conversion('https://lin.ee/pPz1ZqN');
                  }
                  return true;
                }}
              >
                ขอใบเสนอราคาฟรี
              </a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <a
              href="https://lin.ee/pPz1ZqN"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => {
                if (typeof gtag_report_conversion === 'function') {
                  return gtag_report_conversion('https://lin.ee/pPz1ZqN');
                }
                return true;
              }}
            >
              ใบเสนอราคา
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="เปิด/ปิดเมนู"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Contact Info */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-3 space-y-2">
                  <p className="text-sm font-semibold text-gray-900">ติดต่อเรา</p>
                  <a 
                    href="tel:0984542455" 
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>098-454-2455</span>
                  </a>
                  <a 
                    href="https://lin.ee/pPz1ZqN" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600"
                    onClick={() => {
                      if (typeof gtag_report_conversion === 'function') {
                        return gtag_report_conversion('https://lin.ee/pPz1ZqN');
                      }
                      return true;
                    }}
                  >
                    <div className="w-4 h-4 relative">
                      <Image
                        src="/images/line.png"
                        alt="Line"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span>ขอใบเสนอราคา LINE</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}