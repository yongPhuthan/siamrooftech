import type { Metadata } from 'next';
import Image from 'next/image';
import {
  BrickWall,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  CircleAlert,
  CloudSun,
  Eye,
  House,
  Images,
  MapPin,
  MessagesSquare,
  Phone,
  PlugZap,
  PowerOff,
  Radio,
  Route,
  Ruler,
  Settings2,
  ShieldCheck,
  Store,
  Wind,
  Wrench,
} from 'lucide-react';
import { AdsLineCta, AdsSectionHeading } from '@/app/components/google-ads/AdsLandingPrimitives';
import { ElectricAwningInstallationQuality, ElectricAwningInstallationRisks } from '@/app/components/google-ads/ElectricAwningInstallationSections';
import { fileProjects } from '@/data/projects';
import { getProjectProof } from '@/lib/project-proof';
import { canonicalUrl } from '@/lib/seo-config';

export const dynamic = 'force-static';

const PHONE_URL = 'tel:0984542455';
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

const useCases = [
  {
    icon: House,
    title: 'บ้านพักอาศัย',
    copy: 'กางรับแดดเมื่อต้องการใช้งาน และพับคืนพื้นที่ให้ดูโปร่งได้ง่ายด้วยรีโมท',
  },
  {
    icon: Store,
    title: 'ร้านอาหารและคาเฟ่',
    copy: 'ปรับพื้นที่หน้าร้านได้รวดเร็ว ลดภาระการหมุนด้วยมือในช่วงที่ต้องเปิด–ปิดบ่อย',
  },
  {
    icon: Building2,
    title: 'สำนักงานและธุรกิจ',
    copy: 'เหมาะกับพื้นที่ใช้งานประจำที่ต้องการระบบควบคุมสะดวกและภาพรวมที่เรียบร้อย',
  },
];

const siteAssessmentChecks = [
  {
    icon: BrickWall,
    title: 'โครงสร้างที่รองรับการยึด',
    copy: 'ดูสภาพผนัง คาน และพื้นที่เหนือช่องเปิดก่อนกำหนดตำแหน่งระบบ',
  },
  {
    icon: Ruler,
    title: 'หน้ากว้างและระยะยื่น',
    copy: 'ขนาดเป็นจุดเริ่มต้นในการประเมินน้ำหนักและลักษณะการทำงานของกันสาด',
  },
  {
    icon: PlugZap,
    title: 'จุดจ่ายไฟและสภาพแวดล้อม',
    copy: 'ตรวจตำแหน่งแหล่งจ่ายไฟและบริเวณภายนอกที่ระบบต้องทำงานอยู่จริง',
  },
  {
    icon: Clock3,
    title: 'ความถี่และรูปแบบการใช้งาน',
    copy: 'บ้านที่เปิดเป็นครั้งคราวกับร้านค้าที่ปรับพื้นที่หลายช่วงเวลา อาจต้องพิจารณาต่างกัน',
  },
  {
    icon: PowerOff,
    title: 'ต้องการใช้งานสำรองเมื่อไฟดับหรือไม่',
    copy: 'หากต้องการพับเก็บด้วยมือเมื่อไฟฟ้าขัดข้อง ต้องเลือกระบบที่รองรับไว้ตั้งแต่ต้น',
  },
];

const controlChoices = [
  {
    icon: Radio,
    title: 'ระบบไฟฟ้าพร้อมรีโมท',
    copy: 'กาง–พับได้สะดวก เหมาะกับบ้าน ร้านค้า และพื้นที่ที่ต้องปรับการใช้งานเป็นประจำ',
  },
  {
    icon: Settings2,
    title: 'ระบบไฟฟ้า–มือหมุน',
    copy: 'ควบคุมด้วยรีโมทตามปกติ และมีมือหมุนเป็นทางเลือกสำรองเมื่อไฟฟ้าขัดข้อง',
  },
];

const environmentGuidance = [
  {
    icon: CloudSun,
    title: 'สังเกตสภาพอากาศก่อนใช้งาน',
    copy: 'ประเมินแดด ลม และสภาพแวดล้อมบริเวณกันสาดทุกครั้งที่สภาพอากาศเปลี่ยน',
  },
  {
    icon: Wind,
    title: 'พับเก็บเมื่อสภาพแวดล้อมไม่เหมาะ',
    copy: 'ไม่ปล่อยกันสาดกางค้างเมื่อมีลมแรงหรือสภาพอากาศที่อาจกระทบโครงสร้าง',
  },
  {
    icon: Eye,
    title: 'ไม่ฝืนเมื่อพบอาการผิดปกติ',
    copy: 'หยุดใช้งานเมื่อเคลื่อนที่สะดุด มีเสียงเปลี่ยน หรือรีโมทตอบสนองไม่ปกติ',
  },
  {
    icon: ShieldCheck,
    title: 'เว้นพื้นที่การเคลื่อนที่ให้ปลอดโปร่ง',
    copy: 'ตรวจให้ไม่มีสิ่งของกีดขวางแนวแขนพับและบริเวณที่กันสาดกาง–พับ',
  },
];

const checklist = [
  'ประเมินขนาดและลักษณะการใช้งานก่อนเลือกระบบ',
  'อธิบายเหตุผลของระบบที่แนะนำให้ลูกค้าเข้าใจ',
  'ตรวจตำแหน่งติดตั้งและแนวทางเชื่อมต่อระบบไฟ',
  'ตั้งระยะกาง–พับให้สัมพันธ์กับหน้างาน',
  'ทดสอบรีโมทและการทำงานก่อนส่งมอบ',
  'รับประกันระบบและงานติดตั้ง 5 ปี ตามเงื่อนไขบริษัท',
  'อธิบายวิธีใช้งานและช่องทางติดต่อหลังติดตั้ง',
];

type FaqItem = {
  question: string;
  answer: string;
};

const faqs: FaqItem[] = [
  {
    question: 'เลือกขนาดมอเตอร์จากอะไร?',
    answer:
      'ทีมจะดูหน้ากว้าง ระยะยื่น น้ำหนักและลักษณะของระบบ รวมถึงความถี่ในการใช้งาน แล้วจึงแนะนำมอเตอร์ให้เหมาะกับหน้างาน ไม่เลือกจากขนาดพื้นที่เพียงตัวเลขเดียว',
  },
  {
    question: 'ถ้าไฟดับหรือรีโมทมีปัญหาควรทำอย่างไร?',
    answer:
      'ระบบไฟฟ้า–มือหมุนเป็นทางเลือกสำหรับผู้ที่ต้องการพับเก็บด้วยมือเมื่อไฟฟ้าขัดข้อง ส่วนระบบไฟฟ้าปกติไม่ควรถูกฝืนหมุนด้วยมือ หากรีโมทหรือระบบมีอาการผิดปกติควรหยุดใช้งานและติดต่อทีมติดตั้ง',
  },
  {
    question: 'เดินระบบไฟกับบ้านเดิมได้หรือไม่?',
    answer:
      'โดยทั่วไปสามารถประเมินการเชื่อมต่อกับระบบไฟเดิมได้ แต่ต้องดูตำแหน่งแหล่งจ่ายไฟ แนวทางเดินสาย และสภาพพื้นที่จริงก่อน ทีมจะแนะนำวิธีที่เหมาะกับหน้างานแต่ละแห่ง',
  },
  {
    question: 'กันสาดไฟฟ้าเหมาะกับพื้นที่ใช้งานบ่อยอย่างไร?',
    answer:
      'การควบคุมด้วยรีโมทช่วยให้กาง–พับได้สะดวก เหมาะกับบ้านหรือธุรกิจที่ต้องปรับพื้นที่ตามช่วงแดดและการใช้งานระหว่างวัน',
  },
  {
    question: 'ต้องดูแลมอเตอร์และระบบควบคุมอย่างไร?',
    answer:
      'รักษาความสะอาดบริเวณโครงและผ้า สังเกตเสียงหรือการเคลื่อนที่ที่ผิดปกติ และหยุดใช้งานเมื่อพบอาการสะดุด ควรให้ทีมติดตั้งตรวจระบบแทนการฝืนเปิด–ปิดต่อเนื่อง',
  },
  {
    question: 'ผนังหรือโครงสร้างแบบไหนติดตั้งกันสาดไฟฟ้าได้?',
    answer:
      'ต้องประเมินสภาพผนัง คาน จุดยึด และพื้นที่เหนือช่องเปิดจากหน้างานจริง เพราะวัสดุผนังและโครงสร้างแต่ละอาคารไม่เหมือนกัน ทีมจะใช้ข้อมูลนี้ประกอบการกำหนดตำแหน่งและระบบที่เหมาะสม',
  },
  {
    question: 'ถ้าลมหรือฝนเปลี่ยนระหว่างใช้งานควรทำอย่างไร?',
    answer:
      'ควรสังเกตสภาพอากาศและพับเก็บเมื่อมีลมแรงหรือสภาพแวดล้อมไม่เหมาะ การใช้งานจริงต้องอ้างอิงข้อจำกัดของระบบ ผ้า และหน้างานที่ติดตั้ง ไม่ควรใช้คำแนะนำเดียวครอบคลุมกันสาดทุกแบบ',
  },
  {
    question: 'ระบบไฟฟ้า ระบบไฟฟ้า–มือหมุน และระบบมือหมุนต่างกันอย่างไร?',
    answer:
      'ระบบไฟฟ้าเน้นความสะดวกด้วยรีโมท ระบบไฟฟ้า–มือหมุนเพิ่มทางเลือกสำรองเมื่อไฟฟ้าขัดข้อง ส่วนระบบมือหมุนไม่พึ่งพาระบบควบคุมไฟฟ้า การเลือกควรดูขนาดพื้นที่ ความถี่ใช้งาน และความต้องการของเจ้าของพื้นที่',
  },
  {
    question: 'Siamrooftech รับประกันกันสาดไฟฟ้ากี่ปี?',
    answer:
      'Siamrooftech รับประกันระบบและงานติดตั้ง 5 ปี ตามเงื่อนไขบริษัท พร้อมช่องทางติดต่อทีมหลังการติดตั้ง',
  },
];

export default function ElectricAwningGoogleAdsLandingPage() {
  return (
    <main
      data-landing-page="google-ads-electric-awning"
      className="min-w-0 bg-white pb-[calc(7rem+env(safe-area-inset-bottom,0px))] text-neutral-900"
    >
      <header className="border-b border-neutral-300 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div aria-label="Siamrooftech" className="leading-none">
            <p className="text-xl font-black tracking-tight text-[#004589] sm:text-2xl">SIAMROOFTECH</p>
            <p className="mt-1 text-xs font-medium text-neutral-600">สยามรูฟเทค</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={PHONE_URL}
              data-analytics-type="phone"
              data-analytics-position="electric_awning_ads_header"
              className="hidden items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 sm:flex"
            >
              <Phone aria-hidden="true" className="h-4 w-4" /> 098-454-2455
            </a>
            <AdsLineCta tone="monochrome" analyticsPosition="electric_awning_ads_header" label="สอบถาม-ประเมินราคาฟรี" />
          </div>
        </div>
      </header>

      <section className="relative bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-bold text-neutral-900">กันสาดไฟฟ้าสำหรับบ้าน ร้านค้า และธุรกิจ</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.12] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              กันสาดไฟฟ้า ใช้ง่ายด้วยรีโมท มั่นใจตั้งแต่มอเตอร์จนถึงระบบไฟ
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              เลือกมอเตอร์ให้เหมาะกับขนาดและความถี่การใช้งาน ติดตั้งเข้ากับระบบไฟบ้านอย่างเรียบร้อย พร้อมตั้งค่าและทดสอบก่อนส่งมอบ
            </p>
            <p className="mt-5 flex items-center gap-2 text-sm text-neutral-600">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-neutral-900" />
              ส่งรูปพื้นที่ จังหวัด หน้ากว้าง และระยะยื่นโดยประมาณ
            </p>
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
            ['10+ ปี', 'ประสบการณ์งานกันสาด'],
            ['บ้าน · ร้าน · สำนักงาน', 'หน้างานหลากหลายรูปแบบ'],
            ['กรุงเทพฯ และพื้นที่บริการ', 'ประเมินตามพื้นที่หน้างานจริง'],
            ['รับประกัน 5 ปี', 'ครอบคลุมระบบและงานติดตั้ง ตามเงื่อนไขบริษัท'],
          ].map(([value, label]) => (
            <div key={value} className="bg-white px-4 py-6 text-center">
              <p className="text-lg font-black text-neutral-900">{value}</p>
              <p className="mt-1 text-sm text-neutral-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <AdsSectionHeading
          tone="monochrome"
          title="กางเมื่อต้องการร่มเงา พับเมื่ออยากได้พื้นที่โล่ง"
          copy="กันสาดไฟฟ้าช่วยให้การปรับพื้นที่ในแต่ละวันทำได้ง่ายขึ้น โดยระบบต้องถูกเลือกให้เหมาะกับรูปแบบการใช้งานของสถานที่นั้น ๆ"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {useCases.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="border-t border-neutral-300 pt-6">
              <Icon aria-hidden="true" className="h-7 w-7 text-neutral-700" strokeWidth={1.8} />
              <h3 className="mt-5 text-xl font-bold text-neutral-900">{title}</h3>
              <p className="mt-3 leading-7 text-neutral-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>

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
              title="ขนาดเท่ากัน อาจใช้ระบบไม่เหมือนกัน"
              copy="หน้ากว้างและระยะยื่นเป็นเพียงจุดเริ่มต้น เพราะโครงสร้าง จุดจ่ายไฟ สภาพแวดล้อม และรูปแบบการใช้งานของแต่ละพื้นที่ต่างกัน"
            />
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {siteAssessmentChecks.map(({ icon: Icon, title, copy }) => (
                <li key={title} className="border-t border-neutral-300 pt-4 last:sm:col-span-2">
                  <h3 className="mt-1 flex items-start gap-3 font-bold text-neutral-900">
                    <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-neutral-700" strokeWidth={1.8} />
                    <span>{title}</span>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ElectricAwningInstallationQuality />

      <section className="border-b border-neutral-300 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.76fr_1.24fr] lg:items-start lg:gap-16 lg:px-8 lg:py-20">
          <AdsSectionHeading
            tone="monochrome"
            eyebrow="ความสะดวกและทางเลือกเมื่อไฟดับ"
            title="เลือกระบบให้พร้อมกับวิธีใช้งานจริง"
            copy="ทั้งสองแบบใช้มอเตอร์ไฟฟ้า แต่ความสามารถในการพับเก็บเมื่อไฟฟ้าขัดข้องต้องถูกกำหนดตั้งแต่ขั้นเลือกระบบ"
          />
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {controlChoices.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="border-t border-neutral-300 pt-6">
                  <div className="text-neutral-900">
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-neutral-900">{title}</h3>
                  <p className="mt-3 leading-7 text-neutral-600">{copy}</p>
                </article>
              ))}
            </div>
            <p className="mt-5 flex gap-3 rounded-none border border-neutral-300 bg-neutral-100 p-4 text-sm leading-6 text-neutral-900">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-neutral-600" strokeWidth={1.8} />
              <span>
                ใช้มือหมุนได้เฉพาะระบบที่ออกแบบมารองรับ ไม่ควรฝืนหมุนระบบไฟฟ้าปกติหรือดัดแปลงอุปกรณ์เอง
              </span>
            </p>
          </div>
        </div>
      </section>

      <ElectricAwningInstallationRisks />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <AdsSectionHeading
            tone="monochrome"
            eyebrow="พฤติกรรมช่วยดูแลระบบ"
            title="ใช้งานให้เหมาะกับสภาพแวดล้อม"
            copy="กันสาดแต่ละระบบมีข้อจำกัดต่างกัน การสังเกตสภาพอากาศและอาการของระบบช่วยลดการฝืนใช้งานโดยไม่จำเป็น"
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {environmentGuidance.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="border-t border-neutral-300 pt-5">
                <Icon aria-hidden="true" className="h-6 w-6 text-neutral-900" strokeWidth={1.8} />
                <h3 className="mt-4 text-lg font-bold text-neutral-900">{title}</h3>
                <p className="mt-2 leading-7 text-neutral-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-300 bg-neutral-100">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-20">
            <AdsSectionHeading
              tone="monochrome"
              title="ก่อนเลือกผู้ติดตั้งกันสาดไฟฟ้า ควรถามอะไรบ้าง"
              icon={ClipboardCheck}
              copy="การซื้อเฉพาะสินค้าอาจตอบได้เพียงรุ่นและสเปก แต่ระบบพร้อมประเมินและติดตั้งควรตอบได้ว่าทำไมอุปกรณ์แต่ละส่วนจึงเหมาะกับหน้างานของคุณ"
            />
            <div className="border-l border-neutral-300 pl-6 sm:pl-8">
              <p className="text-sm font-bold text-neutral-900">สิ่งที่ Siamrooftech ส่งมอบ</p>
              <ul className="mt-6 grid gap-4">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-3 text-neutral-700">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center text-neutral-900">
                      <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="leading-7">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <AdsSectionHeading
            tone="monochrome"
            eyebrow="หลักฐานจากหน้างาน"
            title="ผลงานกันสาดไฟฟ้าจริง"
            icon={Images}
            copy="ตัวอย่างระบบมอเตอร์ไฟฟ้าและระบบผสมจากผลงานที่ Siamrooftech ติดตั้งจริง ครอบคลุมบ้าน คาเฟ่ และสำนักงาน"
          />
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

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <AdsSectionHeading tone="monochrome" icon={Route} eyebrow="เริ่มต้นได้ใน 3 ขั้นตอน" title="จากรูปหน้างาน สู่ระบบที่พร้อมใช้งาน" />
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            { icon: Camera, number: '01', title: 'ส่งรูปและขนาดคร่าว ๆ', copy: 'ส่งรูปพื้นที่ จังหวัด หน้ากว้าง และระยะยื่นโดยประมาณทาง LINE' },
            { icon: ClipboardList, number: '02', title: 'ประเมินและแนะนำระบบ', copy: 'ทีมดูข้อจำกัดของพื้นที่และรูปแบบการใช้งาน ก่อนแนะนำระบบที่เหมาะ' },
            { icon: Wrench, number: '03', title: 'ติดตั้ง ตั้งค่า และทดสอบ', copy: 'ติดตั้งระบบ ตั้งระยะ ทดสอบรีโมท และอธิบายการใช้งานก่อนส่งมอบ' },
          ].map(({ icon: Icon, number, title, copy }) => (
            <li key={number} className="relative border-t border-neutral-300 pt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-neutral-900">{number}</p>
                <Icon aria-hidden="true" className="h-6 w-6 text-neutral-700" strokeWidth={1.8} />
              </div>
              <h3 className="mt-3 text-xl font-bold">{title}</h3>
              <p className="mt-3 leading-7 text-neutral-600">{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-neutral-100">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-16">
            <div className="lg:sticky lg:top-8">
              <AdsSectionHeading
                tone="monochrome"
                title="คำถามที่พบบ่อย"
                icon={MessagesSquare}
                copy="คำตอบเบื้องต้นช่วยให้เตรียมข้อมูลได้ง่ายขึ้น ส่วนรายละเอียดของมอเตอร์ โครงสร้าง และระบบไฟต้องประเมินจากหน้างานจริง"
              />
              <figure className="mt-8">
                <div className="overflow-hidden rounded-none bg-neutral-200">
                  <Image
                    src="/images/landing/electric-awning/faq-guide-v1.png"
                    alt="ภาพประกอบเจ้าของบ้านทดลองใช้รีโมทกันสาดไฟฟ้ากับทีมบริการ"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="aspect-[3/2] w-full object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-xs text-neutral-600">ภาพประกอบเพื่ออธิบายระบบ</figcaption>
              </figure>
            </div>
            <div className="divide-y divide-neutral-300 border-y border-neutral-300">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-none text-lg font-bold text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004589] focus-visible:ring-offset-4">
                    {question}
                    <span className="text-2xl font-normal text-neutral-900 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-3xl pt-4 leading-7 text-neutral-600">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-300 bg-white text-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-bold text-neutral-600">พร้อมประเมินจากข้อมูลหน้างานจริง</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              เริ่มกันสาดไฟฟ้าที่เหมาะกับพื้นที่ ตั้งแต่มอเตอร์จนถึงระบบไฟ
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-neutral-600">
              ส่งรูปพื้นที่ จังหวัด หน้ากว้าง และระยะยื่นโดยประมาณ เพื่อให้ทีมดูระบบที่เหมาะกับการใช้งานของคุณ
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-300 bg-neutral-100 px-4 py-8 text-center text-sm text-neutral-600">
        <p>Siamrooftech · บริการประเมินและติดตั้งกันสาดไฟฟ้า</p>
        <a
          href={PHONE_URL}
          data-analytics-type="phone"
          data-analytics-position="electric_awning_ads_footer"
          className="mt-2 inline-flex items-center gap-2 text-neutral-700 hover:text-[#004589]"
        >
          <Phone aria-hidden="true" className="h-4 w-4" /> 098-454-2455
        </a>
      </footer>

      <div className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] right-[calc(2rem+env(safe-area-inset-right,0px))] z-40 hidden max-w-[calc(100%-4rem-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] md:block">
        <AdsLineCta
          tone="monochrome"
          analyticsPosition="electric_awning_ads_sticky_desktop"
          label="สอบถาม-ประเมินราคาฟรี"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 box-border max-w-full border-t border-neutral-300 bg-white pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pl-[calc(1.25rem+env(safe-area-inset-left,0px))] pr-[calc(1.25rem+env(safe-area-inset-right,0px))] md:hidden">
        <AdsLineCta
          tone="monochrome"
          fullWidth
          analyticsPosition="electric_awning_ads_sticky_mobile"
          label="สอบถาม-ประเมินราคาฟรี"
        />
      </div>
    </main>
  );
}
