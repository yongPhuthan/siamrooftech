import { ArrowRight, Clock, Phone } from '@phosphor-icons/react/dist/ssr';
import LineContactButton from '@/features/line-contact/LineContactButton';
import { LINE_CONTACT_URL } from '@/features/line-contact/constants';
import { PublicIcon } from '@/components/ui/public';

interface FinalCTASectionProps {
  compactLineButton?: boolean;
  analyticsPosition?: string;
  title?: string;
  subtitle?: string;
  projectTitle?: string;
}

export default function FinalCTASection({
  compactLineButton = false,
  analyticsPosition = 'final_cta',
  title = 'ต้องการกันสาดพับเก็บได้',
  subtitle = 'สำหรับโปรเจกต์ของคุณ?',
}: FinalCTASectionProps) {
  return (
    <section data-site-theme className="relative isolate overflow-hidden bg-slate-900 py-16 text-white sm:py-20 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'7\' cy=\'7\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 text-center sm:gap-10">
          <div className="flex flex-col gap-5">
            <h2 className="heading-section text-white">
              <span className="mb-2 block sm:mb-3">{title}</span>
              <span className="block text-sky-300">{subtitle}</span>
            </h2>
            <div className="flex justify-center"><div className="h-1 w-20 rounded-full bg-gradient-to-r from-blue-400 to-sky-300" /></div>
          </div>
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="mx-auto flex w-full max-w-lg flex-col justify-center gap-4 sm:flex-row sm:gap-5">
              {compactLineButton ? <LineContactButton analyticsPosition={analyticsPosition} /> : (
                <a href={LINE_CONTACT_URL} target="_blank" rel="noopener noreferrer" data-analytics-type="line" data-analytics-position={analyticsPosition} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-site-action bg-site-brand px-5 py-3 text-center font-semibold text-white shadow-sm transition-colors duration-[180ms] hover:bg-site-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:flex-none sm:px-8 sm:py-4">
                  <span>ขอใบเสนอราคาฟรี</span><PublicIcon icon={ArrowRight} size={20} />
                </a>
              )}
              <a href="tel:0984542455" data-analytics-type="phone" data-analytics-position={analyticsPosition} className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 border-2 border-slate-400 px-5 py-3 font-semibold text-slate-100 transition-colors duration-[180ms] hover:border-white hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${compactLineButton ? 'rounded-site-action' : 'rounded-xl'} sm:flex-none sm:px-8 sm:py-4`}>
                <PublicIcon icon={Phone} size={20} />โทรสอบถาม
              </a>
            </div>
            <div className="flex flex-col gap-2 text-center">
              <p className="text-sm text-slate-300 sm:text-base"><PublicIcon icon={Clock} size={16} className="mr-1 inline-block align-[-2px]" /><strong className="text-white">เปิดบริการ:</strong> จันทร์-เสาร์ 8:00-18:00 น.</p>
              <p className="text-xs text-slate-400 sm:text-sm">บริการครอบคลุมทั่วกรุงเทพฯ และปริมณฑล • ประสบการณ์กว่า 10 ปี</p>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
    </section>
  );
}
