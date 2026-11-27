import Image from 'next/image';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { AdsSectionHeading } from './AdsLandingPrimitives';

const riskProofs = [
  {
    src: 'https://assets.siamrooftech.com/medium/7a6166aaa4d6bd66-829a77e5.webp',
    alt: 'กันสาดไฟฟ้าเสียหายจากซัพพอร์ทเหล็กไม่ได้รับการออกแบบและติดตั้งที่ถูกต้อง',
    title: 'การออกแบบงานติดตั้งกับพื้นผิวหน้างานที่ไม่ได้มาตรฐาน อาจทำให้ไม่สามารถรับน้ำหนักกันสาดไฟฟ้าได้',
    copy: 'การติดตั้งกันสาดไฟฟ้าในพื้นผิวที่่ไม่ได้ออกแบบมาให้รับน้ำหนัก อาจทำให้กันสาดไฟฟ้าเกิดการบิดหรือหลุดออกจากผนังเมื่อใช้งานจริงและเกิดอันตรายต่อผู้อยู่อาศัย',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/9a9c6c4aaf55e698-bf1f41ec.webp',
    alt: 'ผ้าใบกันสาดฉีกขาดจากแรงลมและวัสดุคุณภาพต่ำ',
    title: 'ความเสียหายอาจกระทบทั้งคนและทรัพย์สิน',
    copy: 'กันสาดคือสินค้าที่ต้องติดตั้งในพื้นที่สูงและมีน้ำหนักมาก เมื่อเกิดความเสียหายอาจกระทบกับทรัพย์สินและความปลอดภัยของผู้อยู่อาศัย',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/07923f6bdf1c414a-38035458.webp',
    alt: 'ความเสี่ยงจากการติดตั้งด้วยตัวเองหรือช่างผู้ไม่ชำนาญงาน',
    title: 'เลือกตำแหน่งยึดและอุปกรณ์ติดตั้งที่ไม่เหมาะสม อาจทำให้รับน้ำหนักได้ไม่ดีพอและเกิดความเสียหาย',
    copy: 'ผนัง คาน และพื้นผิวแต่ละแบบรับแรงไม่เหมือนกัน การเลือกตำแหน่งยึดและอุปกรณ์จากหน้างานจริงช่วยลดความเสี่ยงที่โครงจะขยับหรือพังภายหลัง',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/a6e82cd27b1ce946-88c023e4.webp',
    alt: 'กันสาดลื่นไถล ราวรองรับไม่ตรง และแขนกันสาดโค้งผิดรูป',
    title: 'วัสดุผ้าใบกันสาดแบบบางเกินไปอาจฉีกขาดจากแรงลมและการใช้งานจริง',
    copy: 'คุณภาพวัสดุของผ้าใบมีผลอย่างมากต่ออายุใช้งานจริง การกันน้ำ และความทนทานต่อสภาพอากาศเมืองไทย',
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
              eyebrow=""
              title="ความเสี่ยงจากการเลือกกันสาดไฟฟ้าผิดประเภท และการติดตั้งที่ไม่ได้มาตรฐาน"
              copy="ตัวอย่างเคสแก้งานที่เกิดความเสียหายต่อทรัพย์สินและความปลอดภัยของผู้อยู่อาศัย"
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

  
      </div>
    </section>
  );
}
