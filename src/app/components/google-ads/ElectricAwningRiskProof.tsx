import Image from 'next/image';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { AdsSectionHeading } from './AdsLandingPrimitives';

const riskProofs = [
  {
    src: 'https://assets.siamrooftech.com/medium/7a6166aaa4d6bd66-1763383268896-psbcsx-jpg.jpg',
    alt: 'กันสาดพับเก็บได้พังจากโครงเหล็กไม่ได้รับการยึดที่ถูกต้อง',
    title: 'กันสาดบางรุ่นไม่สามารถรับน้ำหนักได้จริง',
    copy: 'กันสาดที่ออกแบบมาสำหรับงานเบาอาจบิดตัวหรือหลุดจากผนังเมื่อใช้งานจริง ความแข็งแรงจึงต้องพิจารณาร่วมกับโครงสร้างและวิธีติดตั้งของแต่ละหน้างาน',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/9a9c6c4aaf55e698-1763383748186-b17w45-jpg.jpg',
    alt: 'ผ้าใบกันสาดฉีกขาดจากแรงลมและวัสดุคุณภาพต่ำ',
    title: 'ความเสียหายอาจกระทบทั้งคนและทรัพย์สิน',
    copy: 'หากโครงสร้างหรือจุดยึดไม่ได้มาตรฐาน กันสาดที่เสียหายอาจกระทบรถ ผนังบ้าน และพื้นที่ใช้งาน รวมถึงความปลอดภัยของผู้อยู่อาศัย',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/07923f6bdf1c414a-1763383501722-mds2ou-jpg.jpg',
    alt: 'ความเสี่ยงจากการติดตั้งด้วยตัวเองหรือช่างผู้ไม่ชำนาญงาน',
    title: 'การติดตั้งต้องเริ่มจากการประเมินจุดรับแรง',
    copy: 'ผนัง คาน และพื้นผิวแต่ละแบบรับแรงไม่เหมือนกัน การเลือกตำแหน่งยึดและอุปกรณ์จากหน้างานจริงช่วยลดความเสี่ยงที่โครงจะขยับหรือพังภายหลัง',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/a6e82cd27b1ce946-1763383748189-n995oi-jpg.jpg',
    alt: 'กันสาดลื่นไถล ราวรองรับไม่ตรง และแขนกันสาดโค้งผิดรูป',
    title: 'วัสดุและอุปกรณ์ต้องเหมาะกับสภาพภายนอก',
    copy: 'ความหนาและคุณภาพของผ้าใบมีผลต่ออายุใช้งาน การกันน้ำ และความทนทานต่อสภาพอากาศ จึงไม่ควรตัดสินใจจากราคาเพียงอย่างเดียว',
  },
] as const;

export function ElectricAwningRiskProof() {
  return (
    <section className="border-y border-neutral-300 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center [&>div]:mx-auto [&_svg]:mx-auto">
          <AdsSectionHeading
            tone="monochrome"
            icon={WarningCircle}
            eyebrow="เหตุการณ์จริงจากหน้างาน"
            title="ความเสี่ยงจากกันสาดคุณภาพต่ำและการติดตั้งที่ไม่ได้มาตรฐาน"
            copy="ตัวอย่างความเสียหายที่ลูกค้าส่งมาให้ทีมประเมิน สะท้อนว่าการเลือกวัสดุ จุดยึด และวิธีติดตั้งมีผลโดยตรงต่อทรัพย์สินและความปลอดภัย"
          />
        </div>

        <div className="mt-10 grid gap-x-8 gap-y-10 lg:grid-cols-2">
          {riskProofs.map(({ src, alt, title, copy }) => (
            <article key={title} className="border-t border-neutral-300 pt-6">
              <figure className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover grayscale"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/65 px-4 py-2 text-center text-xs font-semibold tracking-wide text-white">
                  เหตุการณ์จริง
                </figcaption>
              </figure>
              <h3 className="mt-5 text-xl font-bold leading-8 text-neutral-900">{title}</h3>
              <p className="mt-3 text-base leading-7 text-neutral-600">{copy}</p>
            </article>
          ))}
        </div>

        <p className="mt-10 border-y border-neutral-800 bg-neutral-900 px-5 py-5 text-left text-base leading-7 text-white sm:text-center">
          โครงสร้างที่แข็งแรงและการติดตั้งที่เหมาะกับหน้างาน ช่วยลดทั้งค่าใช้จ่ายในการแก้ไขและความเสี่ยงต่อคนในพื้นที่
        </p>
      </div>
    </section>
  );
}
