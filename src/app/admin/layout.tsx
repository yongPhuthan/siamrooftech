"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navigation = [
    {
      name: 'แดชบอร์ด',
      href: '/admin',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12 12 3.75 20.25 12" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5v10.125a.375.375 0 00.375.375H9.75v-4.5h4.5v4.5h4.875a.375.375 0 00.375-.375V10.5" />
        </svg>
      ),
    },
    {
      name: 'จัดการบทความ',
      href: '/admin/articles',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h9a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 015.25 18V6a2.25 2.25 0 012.25-2.25z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25h6M9 12h6M9 15.75h3" />
        </svg>
      ),
    },
    {
      name: 'จัดการโปรเจค',
      href: '/admin/projects',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5l-1.5 13.5h-13.5l-1.5-13.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75v6.75M14.25 9.75v6.75" />
        </svg>
      ),
    },
    {
      name: 'อัปโหลดรูปภาพ',
      href: '/admin/image-upload',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3 3-3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v3" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold text-blue-700">
                <span>สยามรูฟเทค</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                  Admin
                </span>
              </Link>

              <div className="hidden sm:flex sm:items-center sm:space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                target="_blank"
                className="hidden text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 sm:inline"
              >
                ดูเว็บไซต์
              </Link>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 sm:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="สลับเมนู"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white sm:hidden">
            <div className="space-y-1 px-4 py-3">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
                ดูเว็บไซต์
              </Link>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
