import { Metadata } from 'next';
import { Check, EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react/dist/ssr';
import Breadcrumbs from '@/components/site/Breadcrumbs';
import FinalCTASection from '@/components/site/FinalCTASection';
import { PublicIcon } from '@/components/ui/public';
import TrackedContactLink from '../components/TrackedContactLink';
import { canonicalUrl, SERVICE_AREAS_TH } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'ติดต่อเรา - กันสาดพับเก็บได้ | สยามรูฟเทค',
  description: 'ติดต่อสยามรูฟเทคเพื่อปรึกษาและขอใบเสนอราคากันสาดพับเก็บได้ บริการกรุงเทพ นครปฐม นนทบุรี ปทุมธานี สมุทรปราการ อยุธยา สมุทรสาคร',
  keywords: 'ติดต่อ, สยามรูฟเทค, กันสาดพับเก็บได้, ใบเสนอราคา, ปรึกษา',
  alternates: {
    canonical: canonicalUrl('/contact'),
  },
  openGraph: {
    title: 'ติดต่อเรา - กันสาดพับเก็บได้ | สยามรูฟเทค',
    description: 'ติดต่อสยามรูฟเทคเพื่อปรึกษาและขอใบเสนอราคากันสาดพับเก็บได้ ในกรุงเทพและปริมณฑลใกล้เคียง',
    url: canonicalUrl('/contact'),
    images: ['/images/contact-hero.jpg'],
  },
};

export default function ContactPage() {
  return (
    <div data-site-theme className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-site-ink">
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
          <h1 className="heading-display text-gray-900 mb-4">ติดต่อเรา</h1>
          <p className="body-lead text-gray-600 max-w-2xl mx-auto">
            พร้อมให้คำปรึกษาและบริการติดตั้งกันสาดพับเก็บได้ คุณภาพสูง ฟรีค่าออกแบบ
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Primary Contact Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
              <div className="max-w-2xl">
                <p className="eyebrow text-blue-600 mb-3">ประเมินราคาเร็วที่สุด</p>
                <h2 className="heading-section text-gray-900 mb-4">
                  ส่งรูปหน้างานทาง LINE หรือโทรคุยขนาดพื้นที่ได้ทันที
                </h2>
                <p className="body-copy text-gray-600 mb-8">
                  รอบเปิด Google Ads แรกเราจะเน้นช่องทางที่คุยงานจริงได้เร็วกว่าแบบฟอร์ม:
                  ส่งรูปพื้นที่ติดตั้ง ขนาดโดยประมาณ และจังหวัด/เขตที่ติดตั้ง ทีมงานจะประเมินแนวทางและช่วงราคาเบื้องต้นให้
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <TrackedContactLink
                  type="line"
                  position="contact_primary_line"
                  className="flex items-center justify-center gap-3 rounded-xl bg-green-600 px-6 py-4 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.09.02-.5.32-1.75 1.17-.16.1-.3.15-.42.15-.14 0-.27-.04-.4-.09-.21-.08-.37-.13-.37-.25 0-.09.04-.17.12-.24.4-.34.86-.72 1.4-1.14.87-.69 1.74-1.36 2.6-2.01.68-.51 1.15-.85 1.42-1.01.36-.21.75-.32 1.15-.32.23 0 .44.05.63.16.21.12.35.3.42.52z"/>
                  </svg>
                  <span>แชท LINE @siamrooftech</span>
                </TrackedContactLink>

                <TrackedContactLink
                  type="phone"
                  position="contact_primary_phone"
                  className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <PublicIcon icon={Phone} size={24} />
                  <span>โทร 098-454-2455</span>
                </TrackedContactLink>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="font-semibold text-gray-900 mb-1">1. ส่งรูปหน้างาน</div>
                  <p>ถ่ายบริเวณที่จะติดตั้งและจุดยึดผนัง/โครงสร้าง</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="font-semibold text-gray-900 mb-1">2. แจ้งขนาดคร่าว ๆ</div>
                  <p>หน้ากว้าง ระยะยื่น และพื้นที่ติดตั้งโดยประมาณ</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="font-semibold text-gray-900 mb-1">3. รับคำแนะนำ</div>
                  <p>เลือกระบบมือหมุน/มอเตอร์และช่วงราคาที่เหมาะสม</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            
            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="heading-panel text-gray-900 mb-6">ข้อมูลการติดต่อ</h3>
              
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PublicIcon icon={Phone} size={24} className="text-site-brand" />
                  </div>
                  <div>
                    <h4 className="heading-card text-gray-900 mb-1">โทรศัพท์</h4>
                    <TrackedContactLink type="phone" position="contact_info_phone" className="text-blue-600 hover:text-blue-700 font-medium">
                      098-454-2455
                    </TrackedContactLink>
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
                    <h4 className="heading-card text-gray-900 mb-1">Line ID</h4>
                    <TrackedContactLink type="line" position="contact_info_line" className="text-green-600 hover:text-green-700 font-medium">
                      @siamrooftech
                    </TrackedContactLink>
                    <p className="text-sm text-gray-500 mt-1">ตอบกลับเร็ว 24/7</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PublicIcon icon={EnvelopeSimple} size={24} className="text-site-sky" />
                  </div>
                  <div>
                    <h4 className="heading-card text-gray-900 mb-1">อีเมล</h4>
                    <a href="mailto:info@siamrooftech.com" className="text-purple-600 hover:text-purple-700 font-medium">
                      info@siamrooftech.com
                    </a>
                    <p className="text-sm text-gray-500 mt-1">ตอบกลับภายใน 24 ชั่วโมง</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PublicIcon icon={MapPin} size={24} className="text-site-brand" />
                  </div>
                  <div>
                    <h4 className="heading-card text-gray-900 mb-1">ที่อยู่</h4>
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
              <h3 className="heading-panel text-gray-900 mb-6">พื้นที่บริการ</h3>
              <div className="space-y-4">
                {SERVICE_AREAS_TH.map((area) => (
                  <div key={area} className="flex items-center space-x-3">
                    <PublicIcon icon={Check} size={20} className="text-site-brand" />
                    <span className="text-gray-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
              <h3 className="heading-panel mb-4">ต้องการความช่วยเหลือด่วน?</h3>
              <p className="text-blue-100 mb-6 text-sm">
                โทรมาเลยเพื่อปรึกษาโครงการของคุณ
              </p>
              <div className="space-y-3">
                <TrackedContactLink
                  type="phone"
                  position="contact_quick_action_phone"
                  className="w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <PublicIcon icon={Phone} size={20} />
                  <span>โทรเลย</span>
                </TrackedContactLink>
                <TrackedContactLink
                  type="line"
                  position="contact_quick_action_line"
                  className="w-full border-2 border-white text-white py-3 px-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.09.02-.5.32-1.75 1.17-.16.1-.3.15-.42.15-.14 0-.27-.04-.4-.09-.21-.08-.37-.13-.37-.25 0-.09.04-.17.12-.24.4-.34.86-.72 1.4-1.14.87-.69 1.74-1.36 2.6-2.01.68-.51 1.15-.85 1.42-1.01.36-.21.75-.32 1.15-.32.23 0 .44.05.63.16.21.12.35.3.42.52z"/>
                  </svg>
                  <span>แชท Line</span>
                </TrackedContactLink>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-section text-gray-900 mb-4">คำถามที่พบบ่อย</h2>
            <p className="text-gray-600">คำตอบสำหรับคำถามที่ลูกค้าถามบ่อย</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="heading-card text-gray-900 mb-2">
                ใบเสนอราคาฟรีหรือไม่?
              </h3>
              <p className="text-gray-600">
                ใช่ เราให้บริการออกใบเสนอราคาฟรี รวมถึงการสำรวจหน้างานและให้คำปรึกษาโดยไม่เสียค่าใช้จ่าย
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="heading-card text-gray-900 mb-2">
                ใช้เวลาติดตั้งนานเท่าไหร่?
              </h3>
              <p className="text-gray-600">
                โดยทั่วไปใช้เวลา 1-3 วัน ขึ้นอยู่กับขนาดและความซับซ้อนของโครงการ เราจะแจ้งกรอบเวลาที่ชัดเจนในใบเสนอราคา
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="heading-card text-gray-900 mb-2">
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
