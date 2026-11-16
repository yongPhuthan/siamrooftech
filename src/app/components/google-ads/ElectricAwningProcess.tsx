import Image from 'next/image';
import { Path } from '@phosphor-icons/react/dist/ssr';
import { AdsSectionHeading } from './AdsLandingPrimitives';

const processSteps = [
  {
    title: 'แจ้งรายละเอียดหน้างาน',
    note: 'ส่งรูปและขนาดเบื้องต้นทาง LINE',
    copy: 'ส่งรูปพื้นที่ จังหวัด หน้ากว้าง ระยะยื่น และความต้องการพิเศษ เพื่อให้ทีมเข้าใจหน้างานเบื้องต้น',
    image: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/62260',
    alt: 'แจ้งรายละเอียดพื้นที่ติดตั้งกันสาดไฟฟ้า',
  },
  {
    title: 'นัดลงพื้นที่สำรวจ',
    note: 'ตรวจโครงสร้างและจุดจ่ายไฟจริง',
    copy: 'ทีมเข้าตรวจโครงสร้าง จุดจ่ายไฟ และการใช้งานจริง พร้อมนำตัวอย่างวัสดุให้เปรียบเทียบ',
    image: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/53310',
    alt: 'ทีมงานนัดลงพื้นที่สำรวจหน้างาน',
  },
  {
    title: 'สรุประบบและนัดติดตั้ง',
    note: 'ติดตั้งและทดสอบระบบก่อนส่งมอบ',
    copy: 'เมื่อยืนยันรายละเอียดและวัสดุแล้ว ทีมจะสรุปรายการและเข้าติดตั้งตามกำหนดที่ตกลงร่วมกัน',
    image: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/73539',
    alt: 'ทีมช่างเข้าติดตั้งกันสาดไฟฟ้าตามนัดหมาย',
  },
] as const;

export function ElectricAwningProcess() {
  return (
    <section className="border-y border-neutral-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center [&>div]:mx-auto [&_svg]:mx-auto">
          <AdsSectionHeading
            tone="monochrome"
            icon={Path}
            eyebrow="ขั้นตอนการใช้บริการ"
            title="ติดตั้งกันสาดไฟฟ้าใน 3 ขั้นตอน"
            copy="เริ่มจากข้อมูลหน้างานเบื้องต้น ก่อนตรวจพื้นที่จริงและสรุประบบที่เหมาะกับการใช้งาน"
          />
        </div>

        <ol className="mt-12 grid gap-0 lg:grid-cols-3 lg:gap-8">
          {processSteps.map(({ title, note, copy, image, alt }, index) => (
            <li
              key={title}
              className="relative flex gap-5 pb-10 last:pb-0 lg:flex-col lg:gap-5 lg:pb-0"
            >
              {index < processSteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-5 top-11 w-px -translate-x-1/2 bg-neutral-300 lg:-right-8 lg:bottom-auto lg:left-12 lg:top-5 lg:h-px lg:w-auto lg:translate-x-0"
                />
              ) : null}

              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-base font-bold text-white">
                {index + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-col border-t border-neutral-300 pt-5 lg:border-t-0 lg:pt-0">
                <h3 className="text-xl font-bold leading-snug text-neutral-900">{title}</h3>
                <p className="mt-2 w-fit rounded-sm border border-neutral-300 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                  {note}
                </p>
                <p className="mt-3 text-base leading-7 text-neutral-600">{copy}</p>
                <div className="mt-5 overflow-hidden border border-neutral-200 bg-neutral-50 p-4">
                  <Image
                    src={image}
                    alt={alt}
                    width={320}
                    height={240}
                    sizes="(max-width: 1024px) 60vw, 24vw"
                    className="mx-auto aspect-[4/3] w-full max-w-56 object-contain"
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
