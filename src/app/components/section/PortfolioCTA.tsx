'use client';

import { ArrowRight, Clock, Phone } from '@phosphor-icons/react/dist/ssr';
import { PublicIcon } from '@/components/ui/public';
import { trackLineClick, trackPhoneClick } from '@/lib/gtag';
import { LINE_CONTACT_URL } from '@/features/line-contact/constants';

interface PortfolioCTAProps {
  className?: string;
}

/**
 * PortfolioCTA - CTA Section สำหรับหน้า Portfolio Detail
 *
 * Features:
 * - ปุ่ม Line ด้วย tracking ที่ถูกต้อง (bottom position)
 * - ปุ่มโทรศัพท์
 * - Gradient background สวยงาม
 * - Responsive design
 */
export default function PortfolioCTA({ className = '' }: PortfolioCTAProps) {
  const handleLineClick = () => {
    trackLineClick('portfolio_cta');
  };

  const handlePhoneClick = () => {
    trackPhoneClick('0984542455', 'portfolio_cta');
  };

  return (
    <section data-site-theme className={`relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-16 text-white sm:py-20 lg:py-24 ${className}`}>
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 sm:space-y-12">
          {/* Main Headline */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="heading-section text-white">
              <span className="block mb-2 sm:mb-3">ต้องการกันสาดพับเก็บได้</span>
              <span className="block text-sky-300">สำหรับโปรเจกต์ของคุณ?</span>
            </h2>

            {/* Divider */}
            <div className="flex justify-center">
              <div className="w-16 sm:w-24 h-1 rounded-full bg-gradient-to-r from-blue-400 to-sky-300" />
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-lg mx-auto">
              {/* Line Button */}
              <a
                href={LINE_CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLineClick}
                className="flex-1 rounded-site-action bg-site-brand px-5 py-3 text-center font-semibold text-white shadow-sm transition-colors duration-[180ms] hover:bg-site-brand-strong sm:flex-none sm:px-8 sm:py-4"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>ขอใบเสนอราคาฟรี</span>
                  <PublicIcon icon={ArrowRight} size={20} />
                </span>
              </a>

              {/* Phone Button */}
              <a
                href="tel:0984542455"
                onClick={handlePhoneClick}
                className="flex-1 rounded-site-action border border-white/40 px-5 py-3 text-center font-semibold text-white/90 transition-colors duration-[180ms] hover:border-white hover:bg-white/10 hover:text-white sm:flex-none sm:px-8 sm:py-4"
              >
                <span className="flex items-center justify-center gap-2">
                  <PublicIcon icon={Phone} size={20} />
                  <span>โทรปรึกษาทันที</span>
                </span>
              </a>
            </div>

            {/* Additional Info */}
            <div className="text-center space-y-2">
              <p className="text-sm text-white/70 sm:text-base">
                <PublicIcon icon={Clock} size={16} className="mr-1 inline-block align-[-2px]" /><strong className="text-white">เปิดบริการ:</strong> จันทร์-เสาร์ 8:00-18:00 น.
              </p>
              <p className="text-xs text-white/60 sm:text-sm">
                บริการครอบคลุมทั่วกรุงเทพฯ และปริมณฑล • ประสบการณ์กว่า 10 ปี
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
    </section>
  );
}
