'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { List, Phone, X } from '@phosphor-icons/react/dist/ssr';
import { trackPhoneClick } from '@/lib/gtag';
import { hidesSiteChrome, isAdLandingPage } from '@/lib/layout-config';
import { PublicIcon } from '@/components/ui/public';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const showNavLinks = !isAdLandingPage(pathname);
  const navItems = [
    { name: 'หน้าแรก', href: '/' },
    { name: 'ผลงาน', href: '/projects' },
    { name: 'บทความ', href: '/articles' },
  ];

  useEffect(() => {
    if (hidesSiteChrome(pathname)) {
      setIsScrolled(false);
      return;
    }
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  useEffect(() => setIsOpen(false), [pathname]);
  if (hidesSiteChrome(pathname)) return null;

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav data-site-theme aria-label="เมนูหลัก" className={`relative z-50 border-b border-site-border transition-shadow duration-[180ms] ${!showNavLinks ? 'hidden md:block ' : ''}${isScrolled ? 'bg-white/95 shadow-site-card backdrop-blur-md' : 'bg-white shadow-site-card'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between lg:h-24">
          <Link href="/" className="flex items-center gap-3" aria-label="สยามรูฟเทค หน้าแรก">
            <span className="hidden shrink-0 sm:block">
              <Image src="/images/logo/IMG_1149.jpg" alt="Siamrooftech Logo กันสาดพับเก็บได้" width={80} height={80} className="rounded-lg object-contain" style={{ width: 'clamp(64px, 5vw, 80px)', height: 'clamp(64px, 5vw, 80px)', minWidth: '100px', minHeight: '100px' }} priority />
            </span>
            <span className="flex flex-col">
              <span className="text-xl font-bold text-site-brand-strong lg:text-2xl">สยามรูฟเทค</span>
              <span className="hidden text-xs text-site-muted sm:block lg:text-sm">กันสาดพับเก็บได้</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            {showNavLinks && navItems.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={`rounded-site-action px-4 py-2 text-sm font-medium transition-colors duration-[180ms] ${isActive(item.href) ? 'bg-site-brand text-white shadow-sm' : 'text-site-ink hover:bg-site-brand-soft hover:text-site-brand-strong'}`}>
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center lg:hidden">
            {showNavLinks && (
              <button type="button" onClick={() => setIsOpen(!isOpen)} className="rounded-site-action p-2 text-site-ink transition-colors hover:bg-site-subtle hover:text-site-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-focus" aria-label={isOpen ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={isOpen} aria-controls="site-mobile-menu">
                <PublicIcon icon={isOpen ? X : List} size={24} />
              </button>
            )}
          </div>
        </div>
        {showNavLinks && isOpen && (
          <div id="site-mobile-menu" className="border-t border-site-border lg:hidden">
            <div className="flex flex-col gap-1 bg-white px-2 py-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={`rounded-site-action px-3 py-2 text-base font-medium transition-colors ${isActive(item.href) ? 'bg-site-brand text-white' : 'text-site-ink hover:bg-site-subtle hover:text-site-brand-strong'}`} onClick={() => setIsOpen(false)}>
                  {item.name}
                </Link>
              ))}
              <div className="mt-3 border-t border-site-border px-3 pt-4">
                <p className="mb-2 text-sm font-semibold text-site-ink">ติดต่อเรา</p>
                <a href="tel:0984542455" className="inline-flex items-center gap-2 text-sm text-site-muted transition-colors hover:text-site-brand-strong" onClick={() => trackPhoneClick('0984542455', 'navigation_mobile_menu')}>
                  <PublicIcon icon={Phone} size={16} /><span>098-454-2455</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
