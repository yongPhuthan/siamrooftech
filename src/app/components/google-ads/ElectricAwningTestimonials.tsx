import Image from 'next/image';
import { Users } from '@phosphor-icons/react/dist/ssr';

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
const photoBoards: (CustomerPhotoBoard & { caption: string })[] = [
  {
    src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/20140',
    alt: 'ภาพทีม Siamrooftech ถ่ายร่วมกับลูกค้าหน้างานกันสาดพับเก็บได้ที่ติดตั้งเสร็จแล้ว',
    caption: '',
    width: 2844,
    height: 920,
  },
  {
    src: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/78421',
    alt: 'ภาพเจ้าของบ้านและเจ้าของร้านร่วมกับกันสาดพับเก็บได้ที่ Siamrooftech ติดตั้งให้',
    caption: '',
    width: 2824,
    height: 1343,
  },
];

export function ElectricAwningTestimonials() {
  return (
    <section className="border-y border-neutral-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
            กันสาดไฟฟ้า
            <br />
            ไว้ใจสยามรูฟเทค
          </h2>
          <p className="mt-4 text-left text-base leading-8 text-neutral-600 sm:text-center sm:text-lg">
            เราผ่านประสบการณ์ติดตั้งกันสาดไฟฟ้า กันสาดพับได้มาหลายรูปแบบ
            ทำให้เราเข้าใจถึงปัญหาและมีประสบการณ์ในการติดตั้งกันสาดไฟฟ้าในพื้นผิวหน้างานรูปแบบต่างๆ
            งานติดตั้งทุกงานของเราจึงคำนึงถึงความปลอดภัยและปิดทุกความเสี่ยงที่อาจเกิดขึ้นจากการติดตั้งกันสาดไฟฟ้าในพื้นที่ของคุณ
          </p>
        </div>
        <div className="mt-12 grid gap-8">
          {photoBoards.map(({ src, alt, caption, width, height }) => (
            <figure key={src} className="bg-neutral-100">
              <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="h-auto w-full object-contain"
              />
              <figcaption className="border-t border-neutral-200 bg-white px-2 pt-3 text-center text-xs text-neutral-600">
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
