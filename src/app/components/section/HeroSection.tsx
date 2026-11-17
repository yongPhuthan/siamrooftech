import Image from 'next/image';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr';
import { PublicContainer, PublicIcon } from '@/components/ui/public';
import LineContactButton from '@/features/line-contact/LineContactButton';

type Props = {
  keyword: string;
};

const assurances = [
  'สำรวจหน้างานก่อนเสนอราคา',
  'ออกแบบตามผนังและพื้นที่จริง',
  'ดูแลหลังการติดตั้ง',
] as const;

/** Homepage first viewport: offer, primary LINE action and one real installation photo. */
function HeroSection({ keyword }: Props) {
  return (
    <section className="bg-gradient-to-b from-site-brand-soft to-white">
      <PublicContainer width="wide" className="grid items-center gap-10 py-10 sm:py-12 lg:grid-cols-12 lg:gap-14 lg:py-16">
        <div className="lg:col-span-6">
          <p className="eyebrow font-heading inline-flex items-center rounded-site-badge bg-white px-3 py-1 text-site-brand-strong ring-1 ring-site-border">
            ระบบมือหมุน · มอเตอร์ไฟฟ้า
          </p>
          <h1 className="heading-display mt-5 text-site-ink">
            สยามรูฟเทค{' '}
            <span className="block text-site-brand">รับออกแบบติดตั้ง<span className="whitespace-nowrap">{keyword}</span></span>
          </h1>
          <p className="body-lead font-heading mt-5 max-w-xl text-site-muted">
            ทั้งระบบมือหมุนและมอเตอร์ไฟฟ้า สำหรับบ้าน ร้านค้า คาเฟ่ ร้านอาหาร และสำนักงาน
          </p>
          {/* Phones already show the sticky LINE bar; avoid two identical actions in one viewport. */}
          <div className="mt-8 hidden sm:flex">
            <LineContactButton analyticsPosition="homepage_hero" />
          </div>
          <ul className="mt-8 font-heading flex flex-col gap-2 text-sm text-site-ink sm:flex-row sm:flex-wrap sm:gap-x-6">
            {assurances.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <PublicIcon icon={CheckCircle} size={20} className="text-site-brand" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-site-media bg-site-subtle shadow-site-card-hover">
            <Image
              src="/images/bananer-กันสาดพับเก็บได้.webp"
              alt={`${keyword} ติดตั้งใต้ชายคาบ้าน ผลงานโดย Siamrooftech`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </PublicContainer>
    </section>
  );
}

export default HeroSection;
