import { AdsSectionHeading } from './AdsLandingPrimitives';
import { PlugsConnected, Checks, Gear, X } from '@phosphor-icons/react/dist/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

type InstallationStage = {
  icon: PhosphorIcon;
  phase: string;
  title: string;
  copy: string;
};

const installationStages: InstallationStage[] = [
  {
    icon: Gear,
    phase: 'ก่อนเลือก',
    title: 'เลือกมอเตอร์ให้เข้ากับงาน',
    copy: 'ดูขนาด น้ำหนัก และความถี่ในการกาง–พับร่วมกัน ไม่เลือกจากหน้ากว้างเพียงอย่างเดียว',
  },
  {
    icon: PlugsConnected,
    phase: 'ระหว่างติดตั้ง',
    title: 'ดูทั้งจุดยึดและทางเดินไฟ',
    copy: 'ตำแหน่งยึดต้องเหมาะกับโครงสร้าง ส่วนจุดจ่ายไฟและจุดเชื่อมต่อต้องคำนึงถึงสภาพภายนอกอาคาร',
  },
  {
    icon: Checks,
    phase: 'ก่อนส่งมอบ',
    title: 'กางให้สุด พับให้ครบ ลองใช้ด้วยกัน',
    copy: 'ทดสอบรีโมท ระยะหยุด และจังหวะการเคลื่อนที่ พร้อมอธิบายวิธีใช้งานและอาการที่ควรติดต่อทีม',
  },
];

type InstallationRisk = {
  title: string;
  consequence: string;
};

const installationRisks: InstallationRisk[] = [
  {
    title: 'จุดยึดไม่สัมพันธ์กับโครงสร้าง',
    consequence: 'โครงอาจสั่นหรือขยับขณะกาง–พับ เพิ่มภาระให้จุดยึดและส่วนที่รองรับ',
  },
  {
    title: 'มอเตอร์ไม่สัมพันธ์กับระบบ',
    consequence: 'อาจเคลื่อนที่สะดุด หยุดกลางทาง หรือทำงานไม่สม่ำเสมอ',
  },
  {
    title: 'ตั้งระยะกาง–พับไม่เหมาะสม',
    consequence: 'อาจปิดไม่สนิท ผ้าตึงหรือหย่อนเกินไป และม้วนกลับไม่เรียบร้อย',
  },
  {
    title: 'โครง แขนพับ และผ้าไม่อยู่ในแนวเดียวกัน',
    consequence: 'ผ้าอาจเอียงหรือย่น แขนเคลื่อนที่ไม่สมดุล หรือมีเสียงเสียดสี',
  },
  {
    title: 'ระบบไฟไม่เหมาะกับพื้นที่ภายนอก',
    consequence: 'จุดเชื่อมต่ออาจเสื่อมจากสภาพแวดล้อม ทำให้ระบบทำงานติด ๆ ดับ ๆ',
  },
  {
    title: 'ส่งมอบโดยไม่ทดสอบครบวงจร',
    consequence: 'อาจพบปัญหาเมื่อเริ่มใช้จริง หรือไม่ทราบข้อจำกัดและวิธีใช้งานที่เหมาะสม',
  },
];

export function ElectricAwningInstallationQuality() {
  return (
    <section id="installation-quality" className="border-y border-neutral-300 bg-white text-neutral-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-24">
        <div>
          <AdsSectionHeading
            tone="monochrome"
            eyebrow="หัวใจของงานติดตั้ง"
            title="กันสาดไฟฟ้าที่ดีต้องเลือกให้ถูกและติดตั้งให้เหมาะกับหน้างาน"
          />
          <p className="mt-6 max-w-md text-base leading-8 text-neutral-600 sm:text-lg">
            ความสะดวกตอนกดรีโมท เริ่มจากการเลือกและติดตั้งให้เหมาะกับพื้นที่
            ทั้งส่วนที่มองเห็น และส่วนที่อยู่เบื้องหลังการกาง–พับ
          </p>
        </div>
        <ol className="divide-y divide-neutral-300 border-y border-neutral-300">
          {installationStages.map(({ icon: Icon, phase, title, copy }) => (
            <li key={phase} className="grid gap-3 py-6 sm:grid-cols-[6rem_1fr] sm:gap-5 lg:py-7">
              <div className="flex items-center gap-3 pt-1 sm:flex-col sm:items-start">
                <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-neutral-700" />
                <p className="text-sm text-neutral-600">{phase}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold leading-8">{title}</h3>
                <p className="mt-2 text-base leading-7 text-neutral-600">{copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ElectricAwningInstallationRisks() {
  return (
    <section id="installation-risks" className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="text-center [&_h2]:text-balance">
          <AdsSectionHeading
            tone="monochrome"
            eyebrow="เรื่องที่ควรเช็กก่อนติดตั้ง"
            title="ติดตั้งกันสาดไฟฟ้าไม่ถูกต้อง เสี่ยงอะไรบ้าง"
          />
        </div>
        <ul className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200 text-left">
          {installationRisks.map(({ title, consequence }) => (
            <li key={title} className="flex items-start gap-3 py-6 sm:gap-4">
              <X aria-hidden="true" data-risk-icon="x" className="mt-1 h-5 w-5 shrink-0 text-neutral-700" />
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-7 text-neutral-900">{title}</h3>
                <p className="mt-2 text-base leading-7 text-neutral-700">{consequence}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-sm leading-7 text-neutral-600">
            อาการเดียวกันอาจมีได้หลายสาเหตุ หากพบความผิดปกติ ควรหยุดใช้งานและให้ทีมตรวจหน้างาน
            ไม่ฝืนระบบหรือปรับแก้อุปกรณ์เอง
          </p>
        </div>
      </div>
    </section>
  );
}
