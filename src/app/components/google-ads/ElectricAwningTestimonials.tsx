import Image from 'next/image';
import { Users } from '@phosphor-icons/react/dist/ssr';
import { AdsLineCta, AdsSectionHeading } from './AdsLandingPrimitives';

type CustomerPhotoBoard = {
  src: string;
  alt: string;
  /** Intrinsic size -- the two boards have different ratios, so nothing is cropped. */
  width: number;
  height: number;
};

/**
 * Handover photos taken with customers, reusing the same boards the homepage
 * WhyUs section already publishes. They are collages rather than one file per
 * customer, so they render as full-width bands: there is no per-customer name
 * or quote to attach, and none is invented here.
 */
const photoBoards: CustomerPhotoBoard[] = [
  {
    src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/20140',
    alt: 'ภาพทีม Siamrooftech ถ่ายร่วมกับลูกค้าหน้างานกันสาดพับเก็บได้ที่ติดตั้งเสร็จแล้ว',
    width: 2844,
    height: 920,
  },
  {
    src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/78421',
    alt: 'ภาพเจ้าของบ้านและเจ้าของร้านร่วมกับกันสาดพับเก็บได้ที่ Siamrooftech ติดตั้งให้',
    width: 2824,
    height: 1343,
  },
];

export function ElectricAwningTestimonials() {
  return (
    <section className="border-y border-neutral-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <AdsSectionHeading
          tone="monochrome"
          eyebrow="ภาพจากวันส่งมอบ"
          title="ลูกค้าที่ให้ Siamrooftech ติดตั้งจริง"
          icon={Users}
          copy="ภาพถ่ายร่วมกับเจ้าของบ้านและเจ้าของร้านหลังติดตั้งและทดสอบระบบเสร็จ ครอบคลุมงานกันสาดพับเก็บได้ทั้งระบบมือหมุนและระบบไฟฟ้า"
        />
        <div className="mt-12 grid gap-6">
          {photoBoards.map(({ src, alt, width, height }) => (
            <figure key={src} className="bg-neutral-100">
              <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="h-auto w-full object-contain"
              />
            </figure>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <AdsLineCta
            tone="monochrome"
            analyticsPosition="electric_awning_ads_testimonial"
            label="สอบถาม-ประเมินราคาฟรี"
          />
        </div>
      </div>
    </section>
  );
}
