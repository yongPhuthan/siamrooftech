import Image from 'next/image';
import { Warning } from '@phosphor-icons/react/dist/ssr';
import { AdsSectionHeading } from './AdsLandingPrimitives';

type DamageCase = {
  src: string;
  alt: string;
  title: string;
  copy: string;
};

/**
 * Problem/Agitation step of the page (PAS). Photos come from sites customers
 * sent in for assessment -- never from Siamrooftech installations -- and the
 * section says so, so it can never be read as our own work failing. The
 * abstract six-point checklist in ElectricAwningInstallationRisks follows this
 * one and must stay image-free per the ads QA contract.
 */
const damageCases: DamageCase[] = [
  {
    src: 'https://assets.siamrooftech.com/medium/7a6166aaa4d6bd66-1763383268896-psbcsx-jpg.jpg',
    alt: 'กันสาดพับเก็บได้พังจากโครงเหล็กไม่ได้รับการยึดที่ถูกต้อง',
    title: 'จุดยึดไม่สัมพันธ์กับโครงสร้างที่รับน้ำหนักจริง',
    copy: 'โครงที่ยึดไม่ตรงกับส่วนรับแรงของอาคารอาจบิดตัว หลุดจากผนัง หรือถล่มลงมา ยิ่งระบบไฟฟ้าเพิ่มน้ำหนักมอเตอร์เข้าไปในชุดกาง–พับ จุดยึดจึงต้องถูกประเมินจากสภาพผนังจริงก่อนเสมอ',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/9a9c6c4aaf55e698-1763383748186-b17w45-jpg.jpg',
    alt: 'ผ้าใบกันสาดฉีกขาดจากแรงลมและวัสดุคุณภาพต่ำ',
    title: 'ความเสียหายลามไปถึงทรัพย์สินและผู้อยู่อาศัย',
    copy: 'เมื่อกันสาดหลุดหรือถล่ม สิ่งที่อยู่ใต้แนวกาง ทั้งรถ ผนัง และคนที่ใช้พื้นที่อยู่ ล้วนได้รับผลกระทบ ความเสียหายจึงไม่ได้จบที่ตัวกันสาดเพียงอย่างเดียว',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/07923f6bdf1c414a-1763383501722-mds2ou-jpg.jpg',
    alt: 'ความเสี่ยงจากการติดตั้งด้วยตัวเองหรือช่างผู้ไม่ชำนาญงาน',
    title: 'ประเมินหน้างานผิดตั้งแต่ก่อนลงมือ',
    copy: 'ชนิดวัสดุผนัง จุดรับแรง และความสามารถในการรับน้ำหนักของผิวงานต่างกันทุกอาคาร การข้ามขั้นตอนประเมินทำให้เลือกวิธียึดผิดตั้งแต่ต้น และปัญหามักปรากฏหลังใช้งานไปแล้วระยะหนึ่ง',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/a6e82cd27b1ce946-1763383748189-n995oi-jpg.jpg',
    alt: 'แขนกันสาดโค้งผิดแนวและรางรองรับไม่ตรง',
    title: 'แขนพับและรางไม่อยู่ในแนวเดียวกัน',
    copy: 'เมื่อแนวการเคลื่อนที่เพี้ยน ผ้าจะย่นหรือเอียง แขนทำงานไม่สมดุล และในระบบไฟฟ้ามอเตอร์ต้องออกแรงฝืนทุกครั้งที่สั่งกาง–พับ',
  },
];

export function ElectricAwningDamageEvidence() {
  return (
    <section id="damage-evidence" className="border-y border-neutral-300 bg-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center [&_div]:mx-auto [&_svg]:mx-auto">
          <AdsSectionHeading
            tone="monochrome"
            eyebrow="คำเตือนจากสถานการณ์จริง"
            title="ความเสี่ยงจากกันสาดไฟฟ้าคุณภาพต่ำและการติดตั้งที่ไม่ได้มาตรฐาน"
            icon={Warning}
          />
          <p className="mt-5 text-base leading-7 text-neutral-700">
            ตัวอย่างหน้างานที่ลูกค้าส่งมาให้ทีมประเมินก่อนแก้ไข
            ทั้งหมดเป็นงานที่ติดตั้งมาจากที่อื่น ไม่ใช่ผลงานของ Siamrooftech
          </p>
        </div>

        <ul className="mt-12 divide-y divide-neutral-300 border-y border-neutral-300">
          {damageCases.map(({ src, alt, title, copy }, index) => (
            <li
              key={src}
              className={`grid gap-6 py-8 lg:grid-cols-2 lg:items-center lg:gap-12 ${
                index % 2 ? 'lg:[&>figure]:order-2' : ''
              }`}
            >
              <figure className="bg-neutral-200">
                <Image
                  src={src}
                  alt={alt}
                  width={900}
                  height={600}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="aspect-[3/2] w-full object-cover grayscale"
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
