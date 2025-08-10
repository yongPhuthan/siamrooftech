import { Project } from "@/lib/firestore";
import { projectsAdminService } from "@/lib/firestore-admin";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PortfolioDetailClient from "./PortfolioDetailClient";
// จะใช้ local function fetchProjectsData
import PortfolioProvider from "../../components/portfolio/PortfolioProvider";
import { unstable_cache } from "next/cache";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

// ✅ สร้าง cache function สำหรับ project เดียว
const _fetchProjectData = async (slug: string): Promise<Project | null> => {
  console.log(`🆕 [fetchProjectData] CACHE MISS → Fetching slug: ${slug}`);

  let project = await projectsAdminService.getBySlug(slug);
  if (!project) {
    project = await projectsAdminService.getById(slug);
  }
  return project || null;
};

// ✅ สร้าง factory function ให้รับ slug ตอนเรียก
const fetchProjectData = (slug: string) =>
  unstable_cache(
    () => _fetchProjectData(slug),
    [`project-data-${slug}`], // ต้องเป็น string[] คงที่
    { revalidate: 3600 }
  )();

// ✅ ดึงข้อมูลโปรเจคทั้งหมดสำหรับ related projects
const fetchProjectsData = unstable_cache(
  async (): Promise<Project[] | null> => {
    console.log("🆕 [fetchProjectsData-detail] CACHE MISS → Fetching from Firestore...");
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
  ["projects-data"], // cache key เหมือนกัน
  { revalidate: 3600 }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProjectData(slug);

  if (!project) {
    return {
      title: "ไม่พบโปรเจค - สยามรูฟเทค",
      description: "ไม่พบโปรเจคที่คุณต้องการ",
      robots: { index: false, follow: false },
    };
  }

  const seoTitle = `กันสาดพับได้ ${project.type} ${project.width}x${project.extension}ม. | ${project.location} | Siamrooftech`;
  const seoDescription = `ดูผลงานกันสาดพับได้ระบบ${project.type} ขนาด ${project.width}x${project.extension} เมตร ${project.arms_count} แขน วัสดุ${project.canvas_material} ชายผ้า${project.fabric_edge} ที่ ${project.location} ปี ${project.year}`;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      'กันสาดพับได้',
      'กันสาดพับเก็บได้',
      `ผลงานกันสาดพับได้`,
      `กันสาด${project.type}`,
      `กันสาด${project.width}เมตร`,
      `${project.canvas_material}`,
      `ชายผ้า${project.fabric_edge}`,
      project.location,
      project.category,
      'Siamrooftech'
    ],
    alternates: {
      canonical: `https://www.siamrooftech.com/portfolio/${project.slug || project.id}`,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'article',
      url: `https://www.siamrooftech.com/portfolio/${project.slug || project.id}`,
      images: project.featured_image ? [
        {
          url: project.featured_image,
          width: 1200,
          height: 630,
          alt: seoTitle
        }
      ] : [],
      siteName: 'Siamrooftech',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: project.featured_image ? [project.featured_image] : [],
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
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await fetchProjectData(slug);

  const allProjects = await fetchProjectsData();

  if (!project) return notFound();

  return (
    <PortfolioProvider projects={allProjects || []}>
      <PortfolioDetailClient project={project} />
    </PortfolioProvider>
  );
}
