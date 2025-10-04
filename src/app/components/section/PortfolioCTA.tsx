'use client';

import { Button } from '@mui/material';

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
    // Track Line button click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'line_click_bottom', {
        event_category: 'engagement',
        event_label: 'line_button_bottom_section',
        value: 1
      });
    }
  };

  const handlePhoneClick = () => {
    // Track phone click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'phone_click_portfolio_cta', {
        event_category: 'engagement',
        event_label: 'phone_call_from_portfolio',
        value: 1
      });
    }
  };

  return (
    <section className={`relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden ${className}`}>
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              <span className="block mb-2 sm:mb-3">ต้องการกันสาดพับเก็บได้</span>
              <span className="block text-blue-400">สำหรับโปรเจกต์ของคุณ?</span>
            </h2>

            {/* Divider */}
            <div className="flex justify-center">
              <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full" />
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-lg mx-auto">
              {/* Line Button - Simple version without icon */}
              <Button
                variant="contained"
                size="large"
                component="a"
                href="https://lin.ee/pPz1ZqN"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLineClick}
                className="flex-1 sm:flex-none sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>ขอใบเสนอราคาฟรี</span>
                  <span className="text-xl">→</span>
                </span>
              </Button>

              {/* Phone Button */}
              <Button
                variant="outlined"
                size="large"
                href="tel:0984542455"
                component="a"
                onClick={handlePhoneClick}
                className="flex-1 sm:flex-none sm:px-8 py-3 sm:py-4 border-2 border-gray-400 hover:border-white text-gray-200 hover:text-white hover:bg-white/10 font-semibold rounded-xl transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-xl">📞</span>
                  <span>โทรปรึกษาทันที</span>
                </span>
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-center space-y-2">
              <p className="text-sm sm:text-base text-gray-400">
                ⏰ <strong className="text-white">เปิดบริการ:</strong> จันทร์-เสาร์ 8:00-18:00 น.
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
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
