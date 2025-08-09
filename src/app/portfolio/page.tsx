// app/portfolio/page.tsx
import { Metadata } from "next";
import { projectsAdminService } from "../../lib/firestore-admin";
import { Project } from "../../lib/firestore";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import PortfolioWithFilters from "../components/portfolio/PortfolioWithFilters";
import FinalCTASection from "../components/FinalCTASection";
import PortfolioProvider from "../components/portfolio/PortfolioProvider";
import { unstable_cache } from "next/cache";

export const revalidate = 300; // Revalidate every 5 minutes

export const metadata: Metadata = {
  title: "ผลงานทั้งหมด - กันสาดพับเก็บได้ | สยามรูฟเทค",
  description:
    "ชมผลงานการติดตั้งกันสาดพับเก็บได้หลากหลายประเภท ทั้งร้านอาหาร คาเฟ่ บ้านพักอาศัย และอาคารพาณิชย์ จากสยามรูฟเทค",
  keywords:
    "ผลงาน, กันสาดพับเก็บได้, ติดตั้งกันสาด, ร้านอาหาร, คาเฟ่, บ้านพักอาศัย, สยามรูฟเทค",
  openGraph: {
    title: "ผลงานทั้งหมด - กันสาดพับเก็บได้ | สยามรูฟเทค",
    description:
      "ชมผลงานการติดตั้งกันสาดพับเก็บได้หลากหลายประเภท ทั้งร้านอาหาร คาเฟ่ บ้านพักอาศัย และอาคารพาณิชย์",
    type: "website",
  },
};

// ✅ ดึงข้อมูลตรงจาก Firestore (ไม่ผ่าน fetch API loopback) พร้อม Debug logging
const fetchProjectsData = unstable_cache(
  async (): Promise<Project[] | null> => {
    console.log("🆕 [fetchProjectsData] CACHE MISS → Fetching from Firestore...");
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
        <h1 className="text-3xl font-bold text-gray-800">ไม่พบโปรเจค</h1>
        <p className="text-gray-500 mt-2">
          โปรดตรวจสอบอีกครั้ง หรือกลับไปที่{" "}
          <a href="/" className="text-blue-600 underline">
            หน้าแรก
          </a>
        </p>
      </div>
    );
  }

  // ✅ Structured Data สำหรับ SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ผลงานทั้งหมด - กันสาดพับเก็บได้",
    description:
      "ชมผลงานการติดตั้งกันสาดพับเก็บได้หลากหลายประเภท จากสยามรูฟเทค",
    url: "https://siamrooftech.com/portfolio",
    publisher: {
      "@type": "Organization",
      name: "สยามรูฟเทค",
      url: "https://siamrooftech.com",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        "@type": "Product",
        position: index + 1,
        name: project.title,
        description: Array.isArray(project.description)
          ? project.description.join(" ")
          : project.description,
        image: project.featured_image || project.images?.[0]?.original_size,
        url: `https://siamrooftech.com/portfolio/${project.slug || project.id}`,
        category: project.category,
        manufacturer: {
          "@type": "Organization",
          name: "สยามรูฟเทค",
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Breadcrumbs */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumbs
              items={[
                { name: "หน้าแรก", href: "/" },
                { name: "ผลงานทั้งหมด", href: "/portfolio" },
              ]}
            />
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative bg-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                ผลงานทั้งหมด
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                ผลงานการติดตั้ง
                <span className="block text-blue-600">กันสาดพับเก็บได้</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                ชมผลงานการติดตั้งกันสาดพับเก็บได้หลากหลายประเภท
                <br />
                ทั้งร้านอาหาร คาเฟ่ บ้านพักอาศัย และอาคารพาณิชย์
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio with Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <PortfolioProvider projects={projects}>
            <PortfolioWithFilters />
          </PortfolioProvider>
        </div>

        <FinalCTASection />
      </div>
    </>
  );
}
