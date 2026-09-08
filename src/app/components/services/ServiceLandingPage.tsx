import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '../ui/Breadcrumbs';
import FinalCTASection from '../FinalCTASection';
import { ServicePage, servicePageUrl } from '@/lib/service-pages';
import { ServiceProofProject } from '@/lib/service-project-matching';
import { canonicalUrl } from '@/lib/seo-config';
import type { GoogleAdsDynamicContent } from '@/lib/google-ads-dynamic-content';
import { LINE_CONTACT_URL } from '@/features/line-contact/constants';

type ServiceLandingPageProps = {
  page: ServicePage;
  proofProjects?: ServiceProofProject[];
  dynamicContent?: GoogleAdsDynamicContent | null;
};

function buildSchema(page: ServicePage) {
  const pageUrl = servicePageUrl(page.slug);
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'หน้าแรก',
      item: canonicalUrl('/'),
    },
    {
      '@type': 'ListItem',
      position: 2,
        name: page.location ? 'กันสาดพับเก็บได้' : page.title,
      item: page.location ? canonicalUrl('/services/retractable-awning') : pageUrl,
    },
  ];

  if (page.location) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: page.location,
      item: pageUrl,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.metaTitle,
        description: page.metaDescription,
        inLanguage: 'th-TH',
        isPartOf: {
          '@type': 'WebSite',
          name: 'Siamrooftech',
          url: canonicalUrl('/'),
        },
      },
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: page.serviceName,
        description: page.intro,
        serviceType: page.serviceName,
        provider: {
          '@type': 'LocalBusiness',
          name: 'Siamrooftech',
          url: canonicalUrl('/'),
          telephone: '+66-98-454-2455',
        },
        areaServed: page.location
          ? {
              '@type': 'AdministrativeArea',
              name: page.location,
            }
          : page.proofPoints
              .find((point) => point.startsWith('พื้นที่ให้บริการหลัก:'))
              ?.replace('พื้นที่ให้บริการหลัก:', '')
              .split(',')
              .map((area) => ({
                '@type': 'AdministrativeArea',
                name: area.trim(),
              })),
        audience: page.audience.map((audience) => ({
          '@type': 'Audience',
          audienceType: audience,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

export default function ServiceLandingPage({
  page,
  proofProjects = [],
  dynamicContent = null,
}: ServiceLandingPageProps) {
  const schema = buildSchema(page);
  const heroEyebrow = dynamicContent?.eyebrow || page.eyebrow;
  const heroH1 = dynamicContent?.h1 || page.h1;
  const heroIntro = dynamicContent?.intro || page.intro;
  const ctaLabel = dynamicContent?.ctaLabel || 'ส่งรูปให้ประเมินทาง LINE';
  const ctaContext = dynamicContent?.ctaContext;
  const proofEyebrow = dynamicContent?.proofEyebrow || 'ผลงานที่เกี่ยวข้อง';
  const proofTitle =
    dynamicContent?.proofTitle || 'ตัวอย่างงานติดตั้งที่ใช้เป็นหลักฐานประกอบการตัดสินใจ';
  const proofIntro =
    dynamicContent?.proofIntro ||
    'บล็อกนี้ดึงจากผลงานจริงในระบบ portfolio เพื่อให้หน้า service ไม่เป็นแค่ข้อความทั่วไป และช่วยเชื่อมโยง intent ระหว่างบริการ พื้นที่ และผลงานติดตั้ง';
  const breadcrumbs = page.location
    ? [
        { name: 'หน้าแรก', href: '/' },
        { name: 'กันสาดพับเก็บได้', href: '/services/retractable-awning' },
        { name: page.location },
      ]
    : [{ name: 'หน้าแรก', href: '/' }, { name: page.title }];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="bg-white">
        <Breadcrumbs items={breadcrumbs} />

        <section className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
            <div
              className="flex flex-col justify-center"
              data-google-ads-dynamic={dynamicContent ? 'true' : undefined}
              data-ad-kw={dynamicContent?.tokens.ad_kw}
              data-ad-audience={dynamicContent?.tokens.ad_audience}
              data-ad-area={dynamicContent?.tokens.ad_area}
              data-ad-intent={dynamicContent?.tokens.ad_intent}
            >
              <p className="mb-3 text-sm font-semibold text-blue-700">{heroEyebrow}</p>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight text-gray-950 sm:text-4xl lg:text-5xl">
                {heroH1}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
                {heroIntro}
              </p>
              {ctaContext && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
                  {ctaContext}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                {page.secondaryKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={LINE_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics-type="line"
                  data-analytics-position={`${page.primaryKeyword}_hero`}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  {ctaLabel}
                </a>
                <a
                  href="tel:0984542455"
                  data-analytics-type="phone"
                  data-analytics-position={`${page.primaryKeyword}_hero`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                  โทร 098-454-2455
                </a>
              </div>
            </div>
            <div className="relative min-h-[280px] overflow-hidden rounded-2xl bg-gray-100 shadow-sm sm:min-h-[360px]">
              <Image
                src={page.image}
                alt={page.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {dynamicContent && (
          <section className="border-b border-gray-100 bg-white">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
              <div>
                <p className="text-sm font-semibold text-blue-700">เลือกให้ตรงกับงานของคุณ</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">
                  เริ่มจากบริการ พื้นที่ และรูปแบบการใช้งาน
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  ถ้าข้อมูลเบื้องต้นตรงกับงานที่ต้องการ ส่งรูปพื้นที่และขนาดคร่าวๆ ทาง LINE ได้เลย ทีมงานจะช่วยประเมินแนวทางที่เหมาะสมก่อนนัดดูหน้างานจริง
                </p>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                {dynamicContent.summary.map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <dt className="text-xs font-semibold uppercase text-gray-500">{item.label}</dt>
                    <dd className="mt-1 text-base font-semibold text-gray-950">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {page.benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-950">{benefit.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        {dynamicContent && (
          <section className="bg-white">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-blue-700">ก่อนขอราคา</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">ข้อมูลจริงช่วยให้แนะนำได้ตรงขึ้น</h2>
                <div className="mt-5 space-y-4">
                  {dynamicContent.decisionPoints.map((point) => (
                    <section key={point.title} className="border-l-4 border-blue-600 pl-4">
                      <h3 className="font-semibold text-gray-950">{point.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{point.description}</p>
                    </section>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <p className="text-sm font-semibold text-blue-700">เตรียมข้อมูลประเมินราคา</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">
                  {dynamicContent.calculatorMock.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  {dynamicContent.calculatorMock.intro}
                </p>
                <ul className="mt-5 space-y-3">
                  {dynamicContent.calculatorMock.inputs.map((input) => (
                    <li key={input} className="flex gap-3 text-sm leading-relaxed text-gray-800">
                      <span className="mt-1 h-2 w-2 flex-none rounded-full bg-blue-600" />
                      <span>{input}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm leading-relaxed text-gray-700">
                  {dynamicContent.calculatorMock.linePrompt}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={LINE_CONTACT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics-type="line"
                    data-analytics-position={`${page.primaryKeyword}_calculator_mock`}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    ส่งรูปและขนาดทาง LINE
                  </a>
                  <a
                    href="tel:0984542455"
                    data-analytics-type="phone"
                    data-analytics-position={`${page.primaryKeyword}_calculator_mock`}
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100"
                  >
                    โทรถามข้อมูลก่อน
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-gray-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold text-blue-700">วิธีทำงาน</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950">ประเมินจากหน้างานจริงก่อนแนะนำระบบ</h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                หน้างานกันสาดพับเก็บได้แต่ละพื้นที่ไม่เหมือนกัน ทั้งขนาด จุดยึด ทิศแดดฝน และความถี่ในการใช้งาน เราจึงเริ่มจากข้อมูลจริงก่อนเสนอระบบมือหมุนหรือมอเตอร์ไฟฟ้า
              </p>
            </div>
            <ol className="grid gap-4">
              {page.process.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex gap-4">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-950">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl bg-gray-900 p-6 text-white">
              <h2 className="text-2xl font-bold">หลักฐานที่ควรใช้ตัดสินใจ</h2>
              <ul className="mt-5 space-y-3">
                {page.proofPoints.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-relaxed text-gray-100">
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-blue-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/portfolio"
                className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
              >
                ดูผลงานติดตั้งจริง
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-950">คำถามที่พบบ่อย</h2>
              <div className="mt-5 space-y-4">
                {page.faqs.map((faq) => (
                  <section key={faq.question} className="rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="font-semibold text-gray-950">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{faq.answer}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </section>

        {proofProjects.length > 0 && (
          <section className="bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-blue-700">{proofEyebrow}</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">
                  {proofTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {proofIntro}
                </p>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {proofProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={project.href}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-xl"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image
                        src={project.image}
                        alt={project.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-3 p-5">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-800">
                          {project.location}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                          {project.type}
                        </span>
                        {project.hasManualProof && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                            ข้อมูลหน้างานจริง
                          </span>
                        )}
                      </div>
                      <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-gray-950 group-hover:text-blue-700">
                        {project.title}
                      </h3>
                      <dl className="grid gap-2 text-sm text-gray-600">
                        <div>
                          <dt className="font-semibold text-gray-900">ประเภทงาน</dt>
                          <dd>{project.category}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-900">ขนาด</dt>
                          <dd>{project.dimensions}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-900">วัสดุ</dt>
                          <dd>{project.material}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-900">โจทย์หน้างาน</dt>
                          <dd>{project.problem}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-900">วิธีแก้/สิ่งที่ติดตั้ง</dt>
                          <dd>{project.solution}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-900">ผลลัพธ์</dt>
                          <dd>{project.outcome}</dd>
                        </div>
                        {project.proofNotes.length > 0 && (
                          <div>
                            <dt className="font-semibold text-gray-900">หลักฐานเสริม</dt>
                            <dd>{project.proofNotes.join(', ')}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-950">หน้าที่เกี่ยวข้อง</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {page.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <FinalCTASection title={`ต้องการ${page.title}`} subtitle="ให้เหมาะกับหน้างานของคุณ?" />
      </main>
    </>
  );
}
