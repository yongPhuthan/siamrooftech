import { Metadata } from 'next';
import Image from 'next/image';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ContactForm from '../components/ui/ContactForm';
import FinalCTASection from '../components/FinalCTASection';

export const metadata: Metadata = {
  title: 'ติดต่อเรา - กันสาดพับเก็บได้ | สยามรูฟเทค',
  description: 'ติดต่อสยามรูฟเทคเพื่อปรึกษาและขอใบเสนอราคากันสาดพับเก็บได้ ฟรี! บริการมืออาชีพ ติดตั้งทั่วประเทศ',
  keywords: 'ติดต่อ, สยามรูฟเทค, กันสาดพับเก็บได้, ใบเสนอราคา, ปรึกษา',
  openGraph: {
    title: 'ติดต่อเรา - กันสาดพับเก็บได้ | สยามรูฟเทค',
    description: 'ติดต่อสยามรูฟเทคเพื่อปรึกษาและขอใบเสนอราคากันสาดพับเก็บได้ ฟรี!',
    images: ['/images/contact-hero.jpg'],
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Breadcrumbs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs 
            items={[
              { name: 'หน้าแรก', href: '/' },
              { name: 'ติดต่อเรา', href: '/contact' }
            ]} 
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">ติดต่อเรา</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            พร้อมให้คำปรึกษาและบริการติดตั้งกันสาดพับเก็บได้ คุณภาพสูง ฟรีค่าออกแบบ
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            
            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">ข้อมูลการติดต่อ</h3>
              
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">โทรศัพท์</h4>
                    <a href="tel:02-xxx-xxxx" className="text-blue-600 hover:text-blue-700 font-medium">
                      02-xxx-xxxx
                    </a>
                    <p className="text-sm text-gray-500 mt-1">จันทร์-เสาร์ 8:00-18:00</p>
                  </div>
                </div>

                {/* Line */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.09.02-.5.32-1.75 1.17-.16.1-.3.15-.42.15-.14 0-.27-.04-.4-.09-.21-.08-.37-.13-.37-.25 0-.09.04-.17.12-.24.4-.34.86-.72 1.4-1.14.87-.69 1.74-1.36 2.6-2.01.68-.51 1.15-.85 1.42-1.01.36-.21.75-.32 1.15-.32.23 0 .44.05.63.16.21.12.35.3.42.52z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Line ID</h4>
                    <a href="https://line.me/ti/p/@siamroof" className="text-green-600 hover:text-green-700 font-medium">
                      @siamroof
                    </a>
                    <p className="text-sm text-gray-500 mt-1">ตอบกลับเร็ว 24/7</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">อีเมล</h4>
                    <a href="mailto:info@siamrooftech.com" className="text-purple-600 hover:text-purple-700 font-medium">
                      info@siamrooftech.com
                    </a>
                    <p className="text-sm text-gray-500 mt-1">ตอบกลับภายใน 24 ชั่วโมง</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">ที่อยู่</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      123/45 ถนนเลียบคลองภาษีเจริญ<br />
                      แขวงบางชัน เขตคลองสามวา<br />
                      กรุงเทพมหานคร 10510
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Areas */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">พื้นที่บริการ</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">กรุงเทพมหานคร</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">ปริมณฑล</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">ภาคกลาง</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">ต่างจังหวัด (สอบถาม)</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
              <h3 className="text-xl font-bold mb-4">ต้องการความช่วยเหลือด่วน?</h3>
              <p className="text-blue-100 mb-6 text-sm">
                โทรมาเลยเพื่อปรึกษาโครงการของคุณ
              </p>
              <div className="space-y-3">
                <a
                  href="tel:02-xxx-xxxx"
                  className="w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>โทรเลย</span>
                </a>
                <a
                  href="https://line.me/ti/p/@siamroof"
                  className="w-full border-2 border-white text-white py-3 px-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.09.02-.5.32-1.75 1.17-.16.1-.3.15-.42.15-.14 0-.27-.04-.4-.09-.21-.08-.37-.13-.37-.25 0-.09.04-.17.12-.24.4-.34.86-.72 1.4-1.14.87-.69 1.74-1.36 2.6-2.01.68-.51 1.15-.85 1.42-1.01.36-.21.75-.32 1.15-.32.23 0 .44.05.63.16.21.12.35.3.42.52z"/>
                  </svg>
                  <span>แชท Line</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">คำถามที่พบบ่อย</h2>
            <p className="text-gray-600">คำตอบสำหรับคำถามที่ลูกค้าถามบ่อย</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                ใบเสนอราคาฟรีหรือไม่?
              </h3>
              <p className="text-gray-600">
                ใช่ เราให้บริการออกใบเสนอราคาฟรี รวมถึงการสำรวจหน้างานและให้คำปรึกษาโดยไม่เสียค่าใช้จ่าย
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                ใช้เวลาติดตั้งนานเท่าไหร่?
              </h3>
              <p className="text-gray-600">
                โดยทั่วไปใช้เวลา 1-3 วัน ขึ้นอยู่กับขนาดและความซับซ้อนของโครงการ เราจะแจ้งกรอบเวลาที่ชัดเจนในใบเสนอราคา
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                มีการรับประกันหรือไม่?
              </h3>
              <p className="text-gray-600">
                เรารับประกันคุณภาพงานติดตั้ง 2 ปี และอุปกรณ์ตามที่ผู้ผลิตกำหนด พร้อมบริการหลังการขาย
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <FinalCTASection 
        title="ต้องการใบเสนอราคา"
        subtitle="กันสาดพับเก็บได้ฟรี?"
      />
    </div>
  );
}