import Image from 'next/image';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { AdsSectionHeading } from './AdsLandingPrimitives';

type WhyUsPoint = {
  tag: string;
  title: string;
  copy: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

/**
 * "Solution" step of the page (PAS), sitting right after the damage-evidence
 * and six-point risk sections it answers.
 */
const whyUsPoints: WhyUsPoint[] = [
  {
    tag: '01 · จุดยึดและโครงสร้าง',
    title: 'โครงสร้างที่ผ่านการยึดอย่างถูกวิธี',
    copy: 'จุดยึดคือสาเหตุอันดับต้น ๆ ที่ทำให้กันสาดพัง ทีมจึงประเมินสภาพผนังและจุดรับแรงจริงก่อนกำหนดตำแหน่งยึดทุกงาน ไม่ใช้แบบเดียวกับทุกหน้างาน',
    image: {
      src: '/images/landing/electric-awning/1655271694295.webp',
      alt: 'ทีมช่างเดินระบบไฟฟ้าที่จุดควบคุมกันสาดไฟฟ้าหน้างานจริง',
      width: 1280,
      height: 1280,
    },
  },
  {
    tag: '02 · ระบบไฟฟ้าหน้างานจริง',
    title: 'เดินระบบไฟฟ้าร่วมกับแหล่งจ่ายไฟบ้านอย่างปลอดภัย',
    copy: 'ทีมช่างไฟฟ้าตรวจสอบระบบไฟบ้านที่มีอยู่จริงก่อนติดตั้งกันสาดไฟฟ้า เพื่อให้มั่นใจว่าการเดินสายและจุดควบคุมกันสาดไฟฟ้าไม่สร้างความเสี่ยงต่อระบบไฟบ้านของเดิม',
    image: {
      src: '/images/landing/electric-awning/1658991397830.webp',
      alt: 'กันสาดไฟฟ้าที่ติดตั้งเสร็จสมบูรณ์ที่บ้านพักอาศัย',
      width: 1706,
      height: 960,
    },
  },
  {
    tag: '03 · ออกแบบตามพื้นที่ใช้งาน',
    title: 'ออกแบบและติดตั้งมาแล้วหลากหลายรูปแบบหน้างาน',
    copy: 'จากบ้านพักอาศัย ร้านอาหารและคาเฟ่ ไปจนถึงสำนักงาน แต่ละพื้นที่มีข้อจำกัดเรื่องโครงสร้างและรูปแบบการใช้งานต่างกัน ทีมจึงเลือกระบบและอุปกรณ์เสริมจากหน้างานจริง ไม่ใช้สเปกเดียวกับทุกที่',
    image: {
      src: '/images/landing/electric-awning/1688117779665.webp',
      alt: 'กันสาดไฟฟ้าติดตั้งเหนือที่จอดรถพร้อมจุดชาร์จ EV ที่บ้านพักอาศัย',
      width: 1280,
      height: 1280,
    },
  },
  {
    tag: '04 · การรับประกันมอเตอร์',
    title: 'รับประกันมอเตอร์ 2 ปี เสีย เปลี่ยนใหม่ ไม่ซ่อม',
    copy: 'หากมอเตอร์เสียภายในระยะประกัน ทีมเปลี่ยนตัวใหม่ให้ทันที ไม่ใช่การซ่อม ตามเงื่อนไขบริษัท',
    image: {
      src: '/images/landing/electric-awning/line_oa_chat_230511_152401.webp',
      alt: 'จุดยึดกันสาดไฟฟ้ากับโครงหลังคาเหล็กหน้างานจริง',
      width: 1477,
      height: 1108,
    },
  },
];

export function ElectricAwningWhyUs() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center [&>div]:mx-auto [&_svg]:mx-auto">
          <AdsSectionHeading
            tone="monochrome"
            icon={ShieldCheck}
            eyebrow="มาตรฐานงานติดตั้งของทีมช่าง"
            title="สยามรูฟเทค ออกแบบและติดตั้งกันสาดไฟฟ้าที่เหมาะสมกับหน้างานจริงของคุณ"
            copy="เราผ่านประสบการณ์ติดตั้งกันสาดไฟฟ้าในหน้างานจริงหลายรูปแบบ ทำให้เข้าใจถึงปัญหาและมีประสบการณ์ในการติดตั้งกันสาดไฟฟ้าในพื้นผิวหน้างานรูปแบบต่างๆ"
          />
        </div>

        <ul className="mt-12 divide-y divide-neutral-300 border-y border-neutral-300">
          {whyUsPoints.map(({ tag, title, copy, image }, index) => (
            <li
              key={title}
              className={`grid gap-6 py-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-10 ${
                index % 2 ? 'lg:[&>figure]:order-2' : ''
              }`}
            >
              <figure className="aspect-[4/3] w-full overflow-hidden border border-neutral-300 bg-neutral-100 lg:col-span-6">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-full w-full object-cover"
                />
              </figure>
              <div className="min-w-0 lg:col-span-6">
                <p className="text-xs font-bold tracking-wide text-neutral-500">{tag}</p>
                <h3 className="mt-2 text-2xl font-bold leading-snug text-neutral-900">{title}</h3>
                <p className="mt-3 text-base leading-7 text-neutral-700">{copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
