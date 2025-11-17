'use client';

import { ReactNode, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CacheDebugPanel from './CacheDebugPanel';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      await logout();
    }
  };

  const navigationItems = [
    {
      name: 'เพิ่มโปรเจค',
      href: '/admin',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      name: 'จัดการโปรเจค',
      href: '/admin/projects',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0l-4-4m4 4l-4 4" />
        </svg>
      )
    },
    {
      name: 'จัดการบทความ',
      href: '/admin/articles',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      name: 'อัปโหลดรูปภาพ',
      href: '/admin/image-upload',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l2.5 3 2.5-3 2.5 3L17 10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v4" />
        </svg>
      )
    },
    {
      name: 'ดูเว็บไซต์',
      href: '/',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      ),
      external: true
    }
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="เปิดเมนู"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              <h1 className="ml-2 md:ml-0 text-lg md:text-xl font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">ระบบจัดการเนื้อหา - </span>
                <span className="text-blue-600">สยามรูฟเทค</span>
              </h1>
            </div>

            {/* Desktop User Info and Logout */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden md:flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="max-w-32 truncate">{user?.email}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                title="ออกจากระบบ"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline text-sm">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Component = item.external ? 'a' : Link;
              const linkProps = item.external 
                ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                : { href: item.href };

              return (
                <Component
                  key={item.href}
                  {...linkProps}
                  className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Component>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={closeMobileMenu} />
          <nav className="fixed top-16 left-0 bottom-0 flex flex-col w-80 max-w-sm bg-white shadow-xl">
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              {/* User Info on Mobile */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-8 h-8 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">ผู้ดูแลระบบ</p>
                    <p className="text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Component = item.external ? 'a' : Link;
                  const linkProps = item.external 
                    ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                    : { href: item.href };

                  return (
                    <Component
                      key={item.href}
                      {...linkProps}
                      onClick={closeMobileMenu}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                        {item.icon}
                      </span>
                      {item.name}
                      {item.external && (
                        <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </Component>
                  );
                })}
              </div>

              {/* Mobile Logout Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            © 2024 สยามรูฟเทค - ระบบจัดการเนื้อหา
          </div>
        </div>
      </footer>

      {/* Cache Debug Panel - Only in development or when debug is enabled */}
      <CacheDebugPanel />
    </div>
  );
}
