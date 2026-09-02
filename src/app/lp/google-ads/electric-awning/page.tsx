import type { Metadata } from 'next';
import Image from 'next/image';
import {
  Camera,
  CheckCircle,
  Clock,
  GearSix,
  Images,
  MapPin,
  Medal,
  Path,
  PlugCharging,
  Power,
  Ruler,
  ShieldCheck,
  ClipboardText,
  Wall,
  Buildings,
  WarningCircle,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import { AdsLineCta, AdsSectionHeading } from '@/app/components/google-ads/AdsLandingPrimitives';
import { ElectricAwningWhyUs } from '@/app/components/google-ads/ElectricAwningWhyUs';
import { ElectricAwningInstallationQuality, ElectricAwningInstallationRisks } from '@/app/components/google-ads/ElectricAwningInstallationSections';
import { ElectricAwningTestimonials } from '@/app/components/google-ads/ElectricAwningTestimonials';
import TrustedBy from '@/app/components/section/TrustedBy';
import DamageWarningSection from '@/app/components/section/DamageWarningSection';
import WhyUs2 from '@/app/components/section/WhyUs2';
import { fileProjects } from '@/data/projects';
import { getProjectProof } from '@/lib/project-proof';
import { canonicalUrl } from '@/lib/seo-config';
import EndSection from '@/app/components/section/EndSection';
import HowItWorks from '@/app/components/section/HowItWorks';
import LineContactButton from '@/app/components/LineContactButton';
import FinalCTASection from '@/app/components/FinalCTASection';

export const dynamic = 'force-static';

const CANONICAL_PATH = '/services/electric-retractable-awning';

export const metadata: Metadata = {
  title: 'กันสาดไฟฟ้า พร้อมประเมินระบบและติดตั้ง | Siamrooftech',
  description:
    'กันสาดไฟฟ้าสำหรับบ้าน ร้านค้า คาเฟ่ และสำนักงาน เลือกมอเตอร์ให้เหมาะกับหน้างาน พร้อมติดตั้งระบบไฟ ตั้งค่า และทดสอบก่อนส่งมอบ',
  alternates: { canonical: canonicalUrl(CANONICAL_PATH) },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
  openGraph: {
    title: 'กันสาดไฟฟ้า มั่นใจตั้งแต่มอเตอร์จนถึงระบบไฟ',
    description: 'ส่งรูปหน้างานให้ทีม Siamrooftech ประเมินระบบที่เหมาะกับพื้นที่และการใช้งาน',
    url: canonicalUrl(CANONICAL_PATH),
    type: 'website',
    images: [
      {
        url: 'https://assets.siamrooftech.com/original/90640f151a597617-1754738877596-v27zzm-jpg.jpg',
        width: 1200,
        height: 630,
        alt: 'ผลงานติดตั้งกันสาดไฟฟ้าสำหรับบ้านพักอาศัยโดย Siamrooftech',
      },
    ],
  },
};

const selectedProjectIds = [
  'u12Uzh3H1wJeNoLwsMO3',
  '0xsjRpgMF3TUL2uBcpum',
  'ANocfCe2kmiS4wdtv5Sm',
] as const;

const projects = selectedProjectIds.flatMap((id) => {
  const project = fileProjects.find((item) => item.id === id);
  return project ? [{ project, proof: getProjectProof(project) }] : [];
});

const siteAssessmentChecks = [
  {
    icon: Wall,
    title: 'โครงสร้างที่รองรับการยึด',
    copy: 'ดูสภาพผนัง คาน และพื้นที่เหนือช่องเปิดก่อนกำหนดตำแหน่งระบบ',
  },
  {
    icon: Ruler,
    title: 'หน้ากว้างและระยะยื่น',
    copy: 'ขนาดเป็นจุดเริ่มต้นในการประเมินน้ำหนักและลักษณะการทำงานของกันสาด',
  },
  {
    icon: PlugCharging,
    title: 'จุดจ่ายไฟและสภาพแวดล้อม',
    copy: 'ตรวจตำแหน่งแหล่งจ่ายไฟและบริเวณภายนอกที่ระบบต้องทำงานอยู่จริง',
  },
  {
    icon: Clock,
    title: 'ความถี่และรูปแบบการใช้งาน',
    copy: 'บ้านที่เปิดเป็นครั้งคราวกับร้านค้าที่ปรับพื้นที่หลายช่วงเวลา อาจต้องพิจารณาต่างกัน',
  },
  {
    icon: Power,
    title: 'ต้องการใช้งานสำรองเมื่อไฟดับหรือไม่',
    copy: 'หากต้องการพับเก็บด้วยมือเมื่อไฟฟ้าขัดข้อง ต้องเลือกระบบที่รองรับไว้ตั้งแต่ต้น',
  },
];


export default function ElectricAwningGoogleAdsLandingPage() {
  return (
    <main
      data-landing-page="google-ads-electric-awning"
      className="min-w-0 bg-white text-neutral-900"
    >
      <section className="relative bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div>
            {/* Mobile hides the shared navbar entirely (see Navigation.tsx),
                so this is the only brand identity a mobile visitor sees. */}
            <p className="text-base font-black tracking-tight text-[#004589] md:hidden">สยามรูฟเทค</p>
            <p className="mt-3 text-sm font-bold text-neutral-900 md:mt-0">กันสาดไฟฟ้าสำหรับบ้าน ร้านค้า และธุรกิจ</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.12] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              กันสาดไฟฟ้าที่ลูกค้าวางใจ ตั้งแต่มอเตอร์จนถึงระบบไฟฟ้า
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              กันสาดไฟฟ้าที่เหมาะกับขนาดและพื้นผิวหน้างาน ติดตั้งเข้ากับระบบไฟบ้านอย่างปลอดภัย
            </p>
            {/* <p className="mt-5 flex items-center gap-2 text-sm text-neutral-600">
              <CheckCircle aria-hidden="true" className="h-5 w-5 text-neutral-900" />
              ส่งรูปพื้นที่ จังหวัด หน้ากว้าง และระยะยื่นโดยประมาณ
            </p> */}
          </div>

          <figure className="overflow-hidden bg-neutral-100">
            <Image
              src="https://assets.siamrooftech.com/original/90640f151a597617-1754738877596-v27zzm-jpg.jpg"
              alt="ผลงานติดตั้งกันสาดไฟฟ้าสำหรับบ้านพักอาศัยของ Siamrooftech"
              width={1200}
              height={900}
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="border-b border-neutral-300 bg-white py-4">
              <p className="text-xs font-bold text-neutral-900">ผลงานจริง · บ้านพักอาศัย กรุงเทพฯ</p>
              <p className="mt-1 text-sm font-semibold text-neutral-800">ระบบมอเตอร์ไฟฟ้า ขนาด 2.6 × 2 เมตร</p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-label="ข้อมูลบริการ" className="border-y border-neutral-300 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-neutral-200 lg:grid-cols-4">
          {[
            { icon: Medal, value: '10+ ปี', label: 'ประสบการณ์งานกันสาด' },
            { icon: Buildings, value: 'บ้าน · ร้าน · สำนักงาน', label: 'หน้างานหลากหลายรูปแบบ' },
            { icon: MapPin, value: 'กรุงเทพฯ และพื้นที่บริการ', label: 'ประเมินตามพื้นที่หน้างานจริง' },
            { icon: ShieldCheck, value: 'รับประกันมอเตอร์ 2 ปี', label: 'เสีย เปลี่ยนใหม่ ไม่ซ่อม ตามเงื่อนไขบริษัท' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={value} className="bg-white px-4 py-6 text-center">
              <Icon aria-hidden="true" className="mx-auto h-6 w-6 text-neutral-700" />
              <p className="mt-2 text-lg font-black text-neutral-900">{value}</p>
              <p className="mt-1 text-sm text-neutral-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <TrustedBy animated />
        </div>
      </section>

      <ElectricAwningTestimonials />

      <section className="border-y border-neutral-300 bg-neutral-100">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <figure>
            <div className="overflow-hidden rounded-none bg-neutral-200">
              <Image
                src="/images/landing/electric-awning/site-survey-v1.png"
                alt="ภาพประกอบช่างประเมินพื้นที่สำหรับติดตั้งกันสาดไฟฟ้า"
                width={1536}
                height={1024}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-xs text-neutral-600">ภาพประกอบเพื่ออธิบายระบบ</figcaption>
          </figure>

          <div>
            <AdsSectionHeading
              tone="monochrome"
              eyebrow="สำรวจหน้างานก่อนเลือกระบบ"
              title="กันสาดไฟฟ้าขนาดเท่ากัน อาจใช้ระบบไม่เหมือนกัน"
              copy="หน้ากว้างและระยะยื่นเป็นเพียงจุดเริ่มต้น เพราะโครงสร้าง จุดจ่ายไฟ สภาพแวดล้อม และรูปแบบการใช้งานของแต่ละพื้นที่ต่างกัน"
            />
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {siteAssessmentChecks.map(({ icon: Icon, title, copy }) => (
                <li key={title} className="border-t border-neutral-300 pt-4 last:sm:col-span-2">
                  <h3 className="mt-1 flex items-start gap-3 font-bold text-neutral-900">
                    <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-neutral-700" />
                    <span>{title}</span>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <DamageWarningSection />

      <ElectricAwningInstallationQuality />

      <section className="border-b border-neutral-300 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <figure className="overflow-hidden bg-neutral-100">
            <Image
              src="/images/landing/electric-awning/1655271700225.jpg"
              alt="กันสาดไฟฟ้าติดตั้งหน้าร้านค้าในย่านชุมชน"
              width={750}
              height={750}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[3/2] w-full object-cover"
            />
            <figcaption className="mt-3 text-xs text-neutral-600">ผลงานติดตั้งจริง</figcaption>
          </figure>

          <div>
            <AdsSectionHeading
              tone="monochrome"
              eyebrow="ทางเลือกเมื่อไฟดับ"
              title="มีมือหมุนสำรองไว้เมื่อไฟฟ้าขัดข้อง"
              copy="ระบบไฟฟ้า–มือหมุนควบคุมด้วยรีโมทตามปกติ แต่เพิ่มมือหมุนเป็นทางเลือกสำรอง ให้พับเก็บกันสาดได้แม้ไฟฟ้าขัดข้อง"
            />
            <article className="mt-8 border-t border-neutral-300 pt-6">
              <div className="text-neutral-900">
                <GearSix aria-hidden="true" className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-neutral-900">ระบบไฟฟ้า–มือหมุน</h3>
              <p className="mt-3 leading-7 text-neutral-600">
                ควบคุมด้วยรีโมทตามปกติ และมีมือหมุนเป็นทางเลือกสำรองเมื่อไฟฟ้าขัดข้อง
              </p>
            </article>
            <p className="mt-5 flex gap-3 rounded-none border border-neutral-300 bg-neutral-100 p-4 text-sm leading-6 text-neutral-900">
              <WarningCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-neutral-600" />
              <span>
                ใช้มือหมุนได้เฉพาะระบบที่ออกแบบมารองรับ ไม่ควรฝืนหมุนระบบไฟฟ้าปกติหรือดัดแปลงอุปกรณ์เอง
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* <ElectricAwningInstallationRisks /> */}

      <ElectricAwningWhyUs />

      <WhyUs2 keyword="กันสาดไฟฟ้า" />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          {/* <AdsSectionHeading
            tone="monochrome"
            eyebrow="หลักฐานจากหน้างาน"
            title="ผลงานกันสาดไฟฟ้าจริง"
            icon={Images}
            copy="ตัวอย่างระบบมอเตอร์ไฟฟ้าและระบบผสมจากผลงานที่ Siamrooftech ติดตั้งจริง ครอบคลุมบ้าน คาเฟ่ และสำนักงาน"
          /> */}
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {projects.map(({ project, proof }) => (
              <article key={project.id} className="min-w-0 border-b border-neutral-300 pb-6">
                <Image
                  src={project.featured_image || project.images[0].original_size}
                  alt={project.images[0]?.alt_text || `ผลงานกันสาดไฟฟ้า ${proof.category}`}
                  width={900}
                  height={675}
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-neutral-900">{proof.category}</p>
                    <p className="text-xs text-neutral-600">{project.year}</p>
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-neutral-900">{proof.type}</h3>
                  <dl className="mt-5 grid gap-3 text-sm">
                    <div className="flex gap-3">
                      <Ruler aria-hidden="true" className="h-5 w-5 shrink-0 text-neutral-600" />
                      <div><dt className="sr-only">ขนาด</dt><dd>{proof.dimensions}</dd></div>
                    </div>
                    <div className="flex gap-3">
                      <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-neutral-600" />
                      <div><dt className="sr-only">พื้นที่</dt><dd>{proof.serviceArea}</dd></div>
                    </div>
                  </dl>
                  <p className="mt-5 border-t border-neutral-300 pt-5 text-sm leading-7 text-neutral-600">{proof.outcome}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <div className="flex flex-col items-center justify-center gap-4 w-full">
        <HowItWorks keyword={"กันสาดไฟฟ้า"} />
        <div className="flex w-full items-center justify-center px-4">
          <LineContactButton analyticsPosition="bottom" />
        </div>
      </div>
      <div className="bg-gradient-to-br pt-20 mx-auto  from-gray-100 to-gray-200">
        <FinalCTASection compactLineButton />
        <EndSection />
      </div>
    </main>
  );
}
