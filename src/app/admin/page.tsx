'use client';

import ProtectedRoute from '../../components/admin/ProtectedRoute';
import AdminLayout from '../../components/admin/AdminLayout';
import { AuthProvider } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function AdminPage() {
  const primaryCards = [
    {
      title: 'จัดการบทความ',
      description: 'ตรวจสอบสถานะ ปรับปรุง SEO และเผยแพร่บทความใหม่ได้จากที่เดียว',
      href: '/admin/articles',
      icon: (
        <svg className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h9a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 015.25 18V6a2.25 2.25 0 012.25-2.25z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25h6M9 12h6M9 15.75h3" />
        </svg>
      ),
      cta: 'ไปที่ฐานบทความ',
    },
    {
      title: 'จัดการโปรเจค',
      description: 'อัปเดตผลงาน สร้างโปรเจคใหม่ และดูแกลเลอรีของลูกค้าทั้งหมด',
      href: '/admin/projects',
      icon: (
        <svg className="h-10 w-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5l-1.5 13.5h-13.5l-1.5-13.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75v6.75M14.25 9.75v6.75" />
        </svg>
      ),
      cta: 'ไปที่ฐานโปรเจค',
    },
  ];

  return (
    <AuthProvider>
      <ProtectedRoute>
          <div className="mx-auto max-w-5xl space-y-12">
            <header className="text-center space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                แดชบอร์ดผู้ดูแล
              </span>
              <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
                จัดการคอนเทนต์และโปรเจคได้ง่ายในจุดเดียว
              </h1>
              <p className="mx-auto max-w-2xl text-sm text-gray-500 sm:text-base">
                เข้าถึงเครื่องมือสร้างบทความ ปรับแต่งโปรเจค และติดตามสถานะการเผยแพร่ได้อย่างรวดเร็ว พร้อมประสบการณ์ใช้งานที่ออกแบบมาเพื่อทีมงานของคุณ
              </p>
            </header>

            <section>
              <div className="grid gap-6 md:grid-cols-2">
                {primaryCards.map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group flex h-full flex-col justify-between rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                          {card.icon}
                        </div>
                        <svg className="h-5 w-5 text-gray-300 transition-colors group-hover:text-blue-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="none">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-gray-900">{card.title}</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
                      </div>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                      {card.cta}
                      <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                      </svg>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">ลิงก์ด่วน</h3>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li>
                    <Link href="/admin/articles" className="inline-flex items-center gap-2 hover:text-blue-600">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                      </svg>
                      สร้างบทความใหม่
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/projects" className="inline-flex items-center gap-2 hover:text-blue-600">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25h15M5.25 8.25l1.5 10.5h10.5l1.5-10.5" />
                      </svg>
                      เพิ่มโปรเจคผลงาน
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">เคล็ดลับการจัดการ</h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  การอัปเดตบทความด้วยข้อมูลล่าสุดช่วยเพิ่มคะแนน SEO และความน่าเชื่อถือ ในขณะที่โปรเจคใหม่ที่มีภาพประกอบชัดเจนช่วยสร้างความมั่นใจให้ลูกค้า
                </p>
              </div>
            </section>
          </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
