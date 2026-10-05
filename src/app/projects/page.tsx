import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import FinalCTASection from "../components/FinalCTASection";
import ProjectsIndex from "../components/projects/ProjectsIndex";
import type { Project } from "@/lib/firestore";
import { projectsAdminService } from "@/lib/firestore-admin";
import { canonicalUrl } from "@/lib/seo-config";
import { getProjectPath } from "@/lib/project-url";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ผลงานติดตั้งกันสาดพับเก็บได้ | Siamrooftech",
  description: "ชมผลงานติดตั้งกันสาดพับเก็บได้ ทั้งระบบมือหมุนและมอเตอร์ไฟฟ้า สำหรับบ้าน ร้านอาหาร คาเฟ่ และอาคารพาณิชย์",
  alternates: { canonical: canonicalUrl("/projects") },
  openGraph: {
    title: "ผลงานติดตั้งกันสาดพับเก็บได้ | Siamrooftech",
    description: "ชมผลงานติดตั้งจริงจาก Siamrooftech ทั้งระบบมือหมุนและมอเตอร์ไฟฟ้า",
    type: "website",
    url: canonicalUrl("/projects"),
    images: [{
      url: "https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/medium/46570",
      width: 800,
      height: 600,
      alt: "ผลงานติดตั้งกันสาด Siamrooftech",
    }],
  },
  robots: { index: true, follow: true },
};

const fetchProjects = unstable_cache(
  async (): Promise<Project[]> => projectsAdminService.getAll(),
  ["projects-data"],
  { revalidate: 300 },
);

export default async function ProjectsPage() {
  const projects = (await fetchProjects()).sort((a, b) => {
    const dateA = a.completionDate ? new Date(a.completionDate).getTime() : new Date(Number(a.year), 0).getTime();
    const dateB = b.completionDate ? new Date(b.completionDate).getTime() : new Date(Number(b.year), 0).getTime();
    return dateB - dateA;
  });
  const projectPaths = projects.map((project) => ({ project, path: getProjectPath(project) })).filter(
    (item): item is { project: Project; path: string } => item.path !== null,
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ผลงานติดตั้งกันสาดพับเก็บได้ - Siamrooftech",
    description: "รวมผลงานติดตั้งกันสาดพับเก็บได้จาก Siamrooftech",
    url: canonicalUrl("/projects"),
    inLanguage: "th-TH",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: projectPaths.length,
      itemListElement: projectPaths.map(({ project, path }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: project.title,
        url: canonicalUrl(path),
      })),
    },
  };

  if (!projectPaths.length) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900">ยังไม่มีผลงาน</h1>
        <p className="mt-3 text-gray-600">กลับไปดูข้อมูลเพิ่มเติมได้ที่หน้าแรก</p>
        <Link href="/" className="mt-5 text-blue-700 underline">กลับหน้าแรก</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="border-b border-gray-200 bg-white/80">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: "หน้าแรก", href: "/" }, { name: "ผลงานทั้งหมด", href: "/projects" }]} />
        </div>
      </div>
      <header className="border-b border-gray-100 bg-white px-4 py-10 text-center sm:py-12">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">ผลงานทั้งหมด</p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">ผลงานติดตั้งกันสาดพับเก็บได้</h1>
          <p className="mt-3 text-lg leading-8 text-gray-600">ชมผลงานติดตั้งจริงสำหรับบ้าน ร้านอาหาร คาเฟ่ และอาคารพาณิชย์</p>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProjectsIndex projects={projectPaths.map(({ project }) => project)} />
      </div>
      <FinalCTASection />
    </main>
  );
}
