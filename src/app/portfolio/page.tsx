// app/portfolio/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { projectsAdminService } from "../../lib/firestore-admin";
import { Project } from "../../lib/firestore";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import PortfolioWithFilters from "../components/portfolio/PortfolioWithFilters";
import FinalCTASection from "../components/FinalCTASection";
import PortfolioProvider from "../components/portfolio/PortfolioProvider";
import { unstable_cache } from "next/cache";

export const revalidate = 300; // Revalidate every 5 minutes

export const metadata: Metadata = {
  title: "ผลงานกันสาดพับได้ ระบบมือหมุน-มอเตอร์ไฟฟ้า | Siamrooftech",
  description:
    "ชมผลงานกันสาดพับได้คุณภาพสูง ทั้งระบบมือหมุนและมอเตอร์ไฟฟ้า ร้านอาหาร คาเฟ่ บ้านพักอาศัย อาคารพาณิชย์ จาก Siamrooftech ประสบการณ์ 10+ ปี",
  keywords:
    "ผลงานกันสาดพับได้, กันสาดพับเก็บได้, ติดตั้งกันสาดพับได้, ผลงานกันสาดมือหมุน, ผลงานกันสาดมอเตอร์, ร้านอาหาร, คาเฟ่, บ้านพักอาศัย, Siamrooftech",
  alternates: {
    canonical: "https://www.siamrooftech.com/portfolio",
  },
  openGraph: {
    title: "ผลงานกันสาดพับได้ ระบบมือหมุน-มอเตอร์ไฟฟ้า | Siamrooftech",
    description:
      "ชมผลงานกันสาดพับได้คุณภาพสูง ทั้งระบบมือหมุนและมอเตอร์ไฟฟ้า ติดตั้งในร้านอาหาร คาเฟ่ บ้านพักอาศัย อาคารพาณิชย์",
    type: "website",
    url: "https://www.siamrooftech.com/portfolio",
    images: [
      {
        url: "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/46570",
        width: 800,
        height: 600,
        alt: "ผลงานกันสาดพับได้ Siamrooftech",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ✅ ดึงข้อมูลตรงจาก Firestore (ไม่ผ่าน fetch API loopback) พร้อม Debug logging
const fetchProjectsData = unstable_cache(
  async (): Promise<Project[] | null> => {
    const projects = await projectsAdminService.getAll();
    if (!projects) return null;

    return projects.sort((a, b) => {
      const dateA = a.completionDate
        ? new Date(a.completionDate).getTime()
        : new Date(Number(a.year), 0).getTime();
      const dateB = b.completionDate
        ? new Date(b.completionDate).getTime()
        : new Date(Number(b.year), 0).getTime();
      return dateB - dateA;
    });
  },
  ["projects-data"], // cache key
  { revalidate: 300 }
);
export default async function PortfolioPage() {
  const projects = await fetchProjectsData();

  // ✅ กรณีไม่พบข้อมูล → render หน้า empty state + noindex
  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="heading-section text-gray-800">ไม่พบโปรเจค</h1>
        <p className="text-gray-500 mt-2">
          โปรดตรวจสอบอีกครั้ง หรือกลับไปที่{" "}
          <Link href="/" className="text-blue-600 underline">
            หน้าแรก
          </Link>
        </p>
      </div>
    );
  }

  // ✅ Structured Data สำหรับ SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ผลงานกันสาดพับได้ - Siamrooftech",
    description:
      "ชมผลงานกันสาดพับได้คุณภาพสูง ทั้งระบบมือหมุนและมอเตอร์ไฟฟ้า จาก Siamrooftech ประสบการณ์มากกว่า 10 ปี",
    url: "https://www.siamrooftech.com/portfolio",
    inLanguage: "th-TH",
    publisher: {
      "@type": "Organization",
      name: "Siamrooftech",
      url: "https://www.siamrooftech.com",
      logo: "https://www.siamrooftech.com/logo.png",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "หน้าแรก",
          item: "https://www.siamrooftech.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "ผลงานกันสาดพับได้",
          item: "https://www.siamrooftech.com/portfolio",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "ผลงานกันสาดพับได้",
      description: "รวมผลงานติดตั้งกันสาดพับได้ทุกประเภท",
      numberOfItems: projects.length,
      itemListElement: projects.slice(0, 10).map((project, index) => ({
        "@type": "CreativeWork",
        position: index + 1,
        name: project.title,
        description: Array.isArray(project.description)
          ? project.description.join(" ")
          : project.description,
        image: project.featured_image || project.images?.[0]?.original_size,
        url: `https://www.siamrooftech.com/portfolio/${project.slug || project.id}`,
        about: "กันสาดพับได้",
        keywords: "กันสาดพับได้, " + project.category,
        creator: {
          "@type": "Organization",
          name: "Siamrooftech",
          url: "https://www.siamrooftech.com",
        },
        datePublished: project.completionDate || project.created_at,
        workExample: {
          "@type": "VisualArtwork",
          name: project.title,
          artform: "การติดตั้งกันสาดพับได้",
        },
      })),
    },
  };

  return (
    <>
      {/* ✅ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumbs
              items={[
                { name: "หน้าแรก", href: "/" },
                { name: "ผลงานทั้งหมด", href: "/portfolio" },
              ]}
            />
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative bg-white overflow-hidden border-b border-gray-100">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-9">
            <div className="text-center max-w-3xl mx-auto">
              <div className="eyebrow inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 rounded-full mb-3">
                ผลงานทั้งหมด
              </div>
              <h1 className="heading-display text-gray-900 mb-3">
                ผลงานการติดตั้ง
                <span className="block text-blue-600">กันสาดพับเก็บได้</span>
              </h1>
              <p className="body-lead text-gray-600">
                ชมผลงานการติดตั้งกันสาดพับเก็บได้หลากหลายประเภท
                <br />
                ทั้งร้านอาหาร คาเฟ่ บ้านพักอาศัย และอาคารพาณิชย์
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio with Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PortfolioProvider projects={projects}>
            <PortfolioWithFilters />
          </PortfolioProvider>
        </div>

        <FinalCTASection />
      </div>
    </>
  );
}
