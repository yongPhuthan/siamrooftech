import type { Metadata } from 'next';
import Image from 'next/image';
import {
  CaretDown,
  CheckCircle,
  Clock,
  GearSix,
  Images,
  MapPin,
  Medal,
  PlugCharging,
  Power,
  Question,
  Ruler,
  ShieldCheck,
  Stack,
  Wall,
  Buildings,
  WarningCircle,
} from '@phosphor-icons/react/dist/ssr';
import { AdsLineCta, AdsSectionHeading } from '@/app/components/google-ads/AdsLandingPrimitives';
import { ElectricAwningWhyUs } from '@/app/components/google-ads/ElectricAwningWhyUs';
import { ElectricAwningTestimonials } from '@/app/components/google-ads/ElectricAwningTestimonials';
import { ElectricAwningRiskProof } from '@/app/components/google-ads/ElectricAwningRiskProof';
import { ElectricAwningProcess } from '@/app/components/google-ads/ElectricAwningProcess';
import TrustedBy from '@/app/components/section/TrustedBy';
import { fileProjects } from '@/data/projects';
import { getProjectProof } from '@/lib/project-proof';
import { canonicalUrl } from '@/lib/seo-config';
import EndSection from '@/app/components/section/EndSection';
import FinalCTASection from '@/components/site/FinalCTASection';

export const dynamic = 'force-static';

const CANONICAL_PATH = '/services/electric-retractable-awning';

export const metadata: Metadata = {
  title: 'รับออกแบบติดตั้ง กันสาดไฟฟ้า กันสาดพับได้ ด้วยประสบการณืกว่า10ปี พร้อมสำรวจหน้างานและประเมินราคาฟรี | Siamrooftech',
  description: 'บริการออกแบบและติดตั้งกันสาดไฟฟ้าสำหรับบ้าน คาเฟ่ และสำนักงาน คำนวณสเปกตามหน้างาน เดินสายไฟปลอดภัย เก็บงานเนี๊ยบ ทดสอบก่อนส่งมอบ พร้อมรับประกันมอเตอร์ 2 ปีเต็ม',
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

const selectedProjects = [
  { id: 'u12Uzh3H1wJeNoLwsMO3', imageIndex: 1 },
  { id: 'KyeA2zp2JohVgZMD0WpA', imageIndex: 2 },
  { id: 'ANocfCe2kmiS4wdtv5Sm', imageIndex: 0 },
] as const;

const projects = selectedProjects.flatMap(({ id, imageIndex }) => {
  const project = fileProjects.find((item) => item.id === id);
  if (!project) return [];
  const chosenImage = project.images[imageIndex] ?? project.images[0];
  return [{ project, proof: getProjectProof(project), chosenImage }];
});

const faqItems = [
  {
    question: 'ถ้าไฟดับ จะพับเก็บกันสาดไฟฟ้าได้ไหม?',
    answer:
      'หากเลือกรุ่นสองระบบ (มอเตอร์ไฟฟ้า + มือหมุนสำรอง) สามารถใช้มือหมุนเก็บกันสาดได้เมื่อไฟฟ้าขัดข้อง แต่หากเป็นรุ่นมอเตอร์ไฟฟ้าปกติไม่ควรฝืนหมุนเองครับ',
  },
  {
    question: 'ต้องเดินปลั๊กหรือเตรียมระบบไฟไว้รอช่างล่วงหน้าไหม?',
    answer:
      'ไม่จำเป็นต้องเดินรอเองล่วงหน้าครับ ในวันนัดสำรวจหน้างาน ทีมช่างจะตรวจจุดจ่ายไฟเดิมของบ้านหรือร้านให้ก่อน และวางแนวเดินสายให้เหมาะกับหน้างานจริง',
  },
  {
    question: 'รับประกันมอเตอร์อย่างไร และหลังติดตั้งหากมีปัญหาดูแลแบบไหน?',
    answer:
      'รับประกันมอเตอร์ 2 ปี เสียเปลี่ยนใหม่ ไม่ซ่อม ตามเงื่อนไขบริษัท และหากมีปัญหาจากการใช้งาน ทีมบริการหลังการขายพร้อมเข้าตรวจหน้างานภายใน 2–7 วันหลังรับเรื่องครับ',
  },
  {
    question: 'นัดสำรวจหน้างานฟรีเขตไหนบ้าง และต้องส่งอะไรทาง LINE ก่อน?',
    answer:
      'ให้บริการสำรวจและติดตั้งในพื้นที่กรุงเทพฯ นนทบุรี และปทุมธานีครับ เพียงส่งรูปพื้นที่หน้างาน จังหวัด หน้ากว้าง และระยะยื่นโดยประมาณทาง LINE เพื่อให้ทีมประเมินเบื้องต้นก่อนนัดเข้าพื้นที่',
  },
] as const;

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


const suitableSpaces = [
  {
    title: 'บ้านเดี่ยวและทาวน์โฮม',
    copy: 'ใช้กันแดด–ฝนบริเวณลานจอดรถ เฉลียง หรือหน้าบ้าน โดยพับเก็บเปิดโล่งได้เมื่อต้องการ',
  },
  {
    title: 'คาเฟ่ ร้านอาหาร และหน้าร้าน',
    copy: 'ปรับกางหรือเก็บตามช่วงแดดและเวลาเปิดร้าน ช่วยเพิ่มพื้นที่ใช้งานโดยไม่ขวางทางเดิน',
  },
  {
    title: 'สำนักงานและโถงหน้าอาคาร',
    copy: 'เลือกระยะยื่นและระบบควบคุมให้สอดคล้องกับแนวอาคารและการเปิด–ปิดประจำวัน',
  },
] as const;

const preparationSteps = [
  {
    title: 'ขนาดหน้ากว้างและระยะยื่น',
    copy: 'แจ้งขนาดโดยประมาณเป็นเมตรหรือเซ็นติเมตร เพื่อใช้ประเมินชุดโครงสร้างเบื้องต้น',
  },
  {
    title: 'รูปหน้างานมุมกว้างและจุดไฟ',
    copy: 'ส่งภาพให้เห็นผนัง คานยึดเหนือช่องเปิด และตำแหน่งปลั๊กหรือจุดจ่ายไฟเดิมของพื้นที่',
  },
  {
    title: 'จังหวัดและรูปแบบการใช้งาน',
    copy: 'แจ้งพื้นที่หน้างานและความต้องการใช้งาน เช่น ต้องการรุ่นมีมือหมุนสำรองเมื่อไฟดับหรือไม่',
  },
] as const;


export default function ElectricAwningGoogleAdsLandingPage() {
  return (
    <main
      data-site-theme
      data-landing-page="google-ads-electric-awning"
      className="min-w-0 bg-white text-neutral-900"
    >
      <section data-floating-cta-start data-funnel-section="hero" className="relative bg-white font-heading">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div className="text-center md:text-left">
            {/* Mobile hides the shared navbar entirely (see Navigation.tsx),
                so this is the only brand identity a mobile visitor sees. */}
            <p className="text-base font-black tracking-tight text-site-brand-strong md:hidden">สยามรูฟเทค</p>
            <p className="mt-3 text-sm font-bold text-neutral-900 md:mt-0">กันสาดไฟฟ้าสำหรับบ้าน ทาวน์โฮม ร้านค้า และธุรกิจ</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-[1.12] tracking-tight text-neutral-900 sm:text-5xl md:mx-0 lg:text-6xl">
              กันสาดไฟฟ้า ที่ใส่ใจตั้งแต่พื้นผิวหน้างานจนถึงมอเตอร์และระบบไฟฟ้า
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-600 md:mx-0">
              บริการออกแบบและติดตั้งกันสาดไฟฟ้าสำหรับบ้าน คาเฟ่ และสำนักงาน คำนวณสเปกตามหน้างาน เดินสายไฟปลอดภัย เก็บงานเนี๊ยบ ทดสอบก่อนส่งมอบ พร้อมรับประกันมอเตอร์ 2 ปีเต็ม
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 md:mt-8 md:items-start">
              <div className="hidden md:block">
                <AdsLineCta
                  analyticsPosition="electric_awning_ads_hero"
                  label="สอบถาม-ประเมินราคาฟรี"
                  tone="monochrome"
                />
              </div>
              {/* <p className="flex items-center justify-center gap-2 text-sm text-neutral-600 md:justify-start">
                <CheckCircle aria-hidden="true" className="h-5 w-5 text-neutral-900" />
                ส่งรูปพื้นที่ จังหวัด หน้ากว้าง และระยะยื่นโดยประมาณ
              </p> */}
            </div>
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
            {/* <figcaption className="border-b border-neutral-300 bg-white py-4">
              <p className="text-xs font-bold text-neutral-900">ผลงานจริง · บ้านพักอาศัย กรุงเทพฯ</p>
              <p className="mt-1 text-sm font-semibold text-neutral-800">ระบบมอเตอร์ไฟฟ้า ขนาด 2.6 × 2 เมตร</p>
            </figcaption> */}
          </figure>
        </div>
      </section>

      <section data-funnel-section="trust" aria-label="ข้อมูลบริการ" className="border-y border-neutral-300 bg-white">
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

      <div data-funnel-section="testimonials">
        <ElectricAwningTestimonials />
      </div>

      <section data-funnel-section="portfolio" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center [&>div]:mx-auto [&_svg]:mx-auto">
            <AdsSectionHeading
              tone="monochrome"
              eyebrow=""
              title="กันสาดไฟฟ้าสำหรับ บ้าน คาเฟ่ และสำนักงาน"
              icon={Images}
              copy=""
            />
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {projects.map(({ project, proof, chosenImage }) => (
              <article key={project.id} className="min-w-0 border-b border-neutral-300 pb-6 text-left">
                <Image
                  src={chosenImage?.original_size || project.featured_image || project.images[0].original_size}
                  alt={chosenImage?.alt_text || project.images[0]?.alt_text || `ผลงานกันสาดไฟฟ้า ${proof.category}`}
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
                  <h3 className="mt-3 text-xl font-bold text-neutral-900">
                    {project.location || `${proof.category} · ${proof.serviceArea}`}
                  </h3>
                  <dl className="mt-5 grid gap-3 text-sm">
                    <div className="flex gap-3">
                      <Power aria-hidden="true" className="h-5 w-5 shrink-0 text-neutral-600" />
                      <div><dt className="sr-only">ระบบ</dt><dd>{proof.type}</dd></div>
                    </div>
                    <div className="flex gap-3">
                      <Ruler aria-hidden="true" className="h-5 w-5 shrink-0 text-neutral-600" />
                      <div><dt className="sr-only">ขนาด</dt><dd>{proof.dimensions}</dd></div>
                    </div>
                    <div className="flex gap-3">
                      <Stack aria-hidden="true" className="h-5 w-5 shrink-0 text-neutral-600" />
                      <div>
                        <dt className="sr-only">วัสดุและโครงสร้าง</dt>
                        <dd>
                          {proof.material}
                          {project.arms_count ? ` · ${project.arms_count} แขนพับ` : ''}
                        </dd>
                      </div>
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

      <div data-funnel-section="risks">
        <ElectricAwningRiskProof />
      </div>

      {/* <section data-funnel-section="backup_system" className="border-b border-neutral-300 bg-white">
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

          <div className="text-left">
            <div className="text-center [&>div]:mx-auto lg:text-left lg:[&>div]:mx-0">
              <AdsSectionHeading
                tone="monochrome"
                eyebrow="ทางเลือกเมื่อไฟดับ"
                title="มีมือหมุนสำรองไว้เมื่อไฟฟ้าขัดข้อง"
                copy="ระบบไฟฟ้า–มือหมุนควบคุมด้วยรีโมทตามปกติ แต่เพิ่มมือหมุนเป็นทางเลือกสำรอง ให้พับเก็บกันสาดได้แม้ไฟฟ้าขัดข้อง"
              />
            </div>
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
      </section> */}

      <div data-funnel-section="why_us">
        <ElectricAwningWhyUs />
      </div>

      <section data-funnel-section="site_assessment" className="border-y border-neutral-300 bg-neutral-100">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-14">
            <div className="lg:col-span-5">
              <div className="text-center [&>div]:mx-auto lg:text-left lg:[&>div]:mx-0">
                <AdsSectionHeading
                  tone="monochrome"
                  eyebrow="สำรวจหน้างานก่อนเลือกระบบ"
                  title="สำรวจหน้างานจริงก่อนทุกครั้งเพื่อให้มั่นใจว่าติดตั้งได้ปลอดภัยและใช้งานได้ยาวนาน"
                  copy="ทีมช่างเก็บข้อมูลและออกแบบงานติดตั้งกันสาดไฟฟ้าตามหน้างานจริง ทั้งโครงสร้างรับแรง จุดจ่ายไฟ และโจทย์การใช้งานจริงของลูกค้า"
                />
              </div>
              <figure className="mt-8">
                <div className="overflow-hidden border border-neutral-300 bg-neutral-200">
                  <Image
                    src="/images/landing/electric-awning/site-survey-v1.png"
                    alt="ภาพประกอบช่างประเมินพื้นที่สำหรับติดตั้งกันสาดไฟฟ้า"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="aspect-[3/2] w-full object-cover"
                  />
                </div>
              </figure>
              <div data-floating-cta-blocker className="mt-8 border-t border-neutral-300 pt-6">
                <p className="mb-4 max-w-xl text-sm leading-6 text-neutral-600">
                  ไม่แน่ใจว่าหน้างานเหมาะกับระบบใด? ส่งรูปและขนาดโดยประมาณให้ทีมช่วยประเมินเบื้องต้น
                </p>
                <div className="hidden md:block">
                  <AdsLineCta
                    analyticsPosition="electric_awning_ads_site_assessment"
                    label="สอบถาม-ประเมินราคาฟรี"
                    tone="monochrome"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <h3 className="text-xl font-bold text-neutral-900 sm:text-2xl">5 จุดที่ทีมช่างตรวจก่อนกำหนดสเปก</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                ตรวจสอบทั้งโครงสร้างรับแรง จุดจ่ายไฟ และลักษณะการใช้งานจริง เพื่อให้ติดตั้งได้ปลอดภัยและใช้งานได้ยาวนาน
              </p>
              <ol className="mt-6 divide-y divide-neutral-300 border-y border-neutral-300 bg-white">
                {siteAssessmentChecks.map(({ icon: Icon, title, copy }, index) => (
                  <li
                    key={title}
                    className="grid gap-2 px-4 py-5 sm:grid-cols-[2.75rem_14rem_minmax(0,1fr)] sm:items-start sm:gap-4 sm:px-6"
                  >
                    <span className="font-heading text-sm font-bold tabular-nums text-neutral-500">
                      0{index + 1}
                    </span>
                    <div className="flex items-start gap-2.5">
                      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-neutral-700" />
                      <h4 className="font-bold leading-snug text-neutral-900">{title}</h4>
                    </div>
                    <p className="text-sm leading-6 text-neutral-600">{copy}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-14 grid gap-10 border-t border-neutral-300 pt-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 sm:text-2xl">เหมาะกับหน้างานแบบไหน</h3>
              <ul className="mt-5 divide-y divide-neutral-300 border-y border-neutral-300 bg-white">
                {suitableSpaces.map(({ title, copy }) => (
                  <li key={title} className="grid gap-2 px-4 py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4 sm:px-5">
                    <h4 className="flex items-start gap-2 font-bold text-neutral-900">
                      <CheckCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-neutral-700" />
                      <span>{title}</span>
                    </h4>
                    <p className="text-sm leading-6 text-neutral-600">{copy}</p>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      <div data-funnel-section="process">
        <ElectricAwningProcess />
      </div>

      <section id="faq" aria-label="คำถามที่พบบ่อยเกี่ยวกับกันสาดไฟฟ้า" className="border-b border-neutral-300 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center [&>div]:mx-auto [&_svg]:mx-auto">
            <AdsSectionHeading
              tone="monochrome"
              icon={Question}
              eyebrow="คำถามก่อนนัดสำรวจหน้างาน"
              title="คำถามที่พบบ่อยเกี่ยวกับกันสาดไฟฟ้า"
              copy="รวมข้อสงสัยหลักเรื่องไฟดับ การเตรียมระบบไฟ การรับประกัน และพื้นที่ให้บริการ"
            />
          </div>
          <div className="mt-10 divide-y divide-neutral-300 border-y border-neutral-300 bg-white">
            {faqItems.map(({ question, answer }) => (
              <details key={question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left text-base font-bold text-neutral-900 marker:content-none sm:px-6 sm:text-lg">
                  <span>{question}</span>
                  <CaretDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-neutral-600 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-neutral-200 px-5 pb-5 pt-4 text-sm leading-7 text-neutral-600 sm:px-6 sm:text-base">
                  {answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div data-funnel-section="final" className="mx-auto bg-gradient-to-br from-gray-100 to-gray-200">
        <div data-floating-cta-stop>
          <FinalCTASection
            compactLineButton
            analyticsPosition="electric_awning_ads_final"
            title="ต้องการกันสาดไฟฟ้า"
            subtitle="สำหรับบ้าน ร้านค้า หรือสำนักงานของคุณ?"
            serviceAreaText="บริการสำรวจและติดตั้งในกรุงเทพฯ นนทบุรี และปทุมธานี • ประสบการณ์กว่า 10 ปี"
          />
        </div>
        <EndSection />
      </div>
    </main>
  );
}
