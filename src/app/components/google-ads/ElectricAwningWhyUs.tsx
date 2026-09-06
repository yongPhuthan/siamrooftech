import Image from 'next/image';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr';

type WhyUsPoint = {
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
    title: 'โครงสร้างที่ผ่านการยึดอย่างถูกวิธี',
    copy: 'จุดยึดคือสาเหตุอันดับต้น ๆ ที่ทำให้กันสาดพัง ทีมจึงประเมินสภาพผนังและจุดรับแรงจริงก่อนกำหนดตำแหน่งยึดทุกงาน ไม่ใช้แบบเดียวกับทุกหน้างาน',
    image: {
      src: '/images/landing/electric-awning/1655271694295.jpg',
      alt: 'ทีมช่างเดินระบบไฟฟ้าที่จุดควบคุมกันสาดไฟฟ้าหน้างานจริง',
      width: 1280,
      height: 1280,
    },
  },
  {
    title: 'เดินระบบไฟฟ้าร่วมกับแหล่งจ่ายไฟบ้านอย่างปลอดภัย',
    copy: 'ทีมช่างไฟฟ้าตรวจสอบระบบไฟบ้านที่มีอยู่จริงก่อนติดตั้งกันสาดไฟฟ้า เพื่อให้มั่นใจว่าการเดินสายและจุดควบคุมกันสาดไฟฟ้าไม่สร้างความเสี่ยงต่อระบบไฟบ้านของเดิม',
    image: {
      src: '/images/landing/electric-awning/1658991397830.jpg',
      alt: 'กันสาดไฟฟ้าที่ติดตั้งเสร็จสมบูรณ์ที่บ้านพักอาศัย',
      width: 1706,
      height: 960,
    },
  },
  {
    title: 'ออกแบบและติดตั้งมาแล้วหลากหลายรูปแบบหน้างาน',
    copy: 'จากบ้านพักอาศัย ร้านอาหารและคาเฟ่ ไปจนถึงสำนักงาน แต่ละพื้นที่มีข้อจำกัดเรื่องโครงสร้างและรูปแบบการใช้งานต่างกัน ทีมจึงเลือกระบบและอุปกรณ์เสริมจากหน้างานจริง ไม่ใช้สเปกเดียวกับทุกที่',
    image: {
      src: '/images/landing/electric-awning/1688117779665.jpg',
      alt: 'กันสาดไฟฟ้าติดตั้งเหนือที่จอดรถพร้อมจุดชาร์จ EV ที่บ้านพักอาศัย',
      width: 1280,
      height: 1280,
    },
  },
  {
    title: 'รับประกันมอเตอร์ 2 ปี เสีย เปลี่ยนใหม่ ไม่ซ่อม',
    copy: 'หากมอเตอร์เสียภายในระยะประกัน ทีมเปลี่ยนตัวใหม่ให้ทันที ไม่ใช่การซ่อม ตามเงื่อนไขบริษัท',
    image: {
      src: '/images/landing/electric-awning/line_oa_chat_230511_152401.jpg',
      alt: 'จุดยึดกันสาดไฟฟ้ากับโครงหลังคาเหล็กหน้างานจริง',
      width: 1477,
      height: 1108,
    },
  },
];

export function ElectricAwningWhyUs() {
  return (
    <section className=" bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 text-center">
          <ShieldCheck aria-hidden="true" className="h-7 w-7 shrink-0 text-neutral-700" />
          <h2 className="text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
            ความมั่นใจที่มาพร้อมกันสาดไฟฟ้าทุกชุด
          </h2>
        </div>

        <ul className="mt-12 divide-y divide-neutral-300 border-y border-neutral-300">
          {whyUsPoints.map(({ title, copy, image }, index) => (
            <li
              key={title}
              className={`grid gap-6 py-8 lg:grid-cols-2 lg:items-center lg:gap-12 ${
                index % 2 ? 'lg:[&>figure]:order-2' : ''
              }`}
            >
              <figure className="aspect-[3/2] w-full overflow-hidden bg-neutral-200">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-full w-full object-cover"
                />
              </figure>
              <div className="min-w-0">
                <h3 className="text-xl font-bold leading-8 text-neutral-900">{title}</h3>
                <p className="mt-3 text-base leading-7 text-neutral-700">{copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
