import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetailClient from "../../components/projects/ProjectDetailClient";
import type { Project } from "@/lib/firestore";
import { projectsAdminService } from "@/lib/firestore-admin";
import { canonicalUrl } from "@/lib/seo-config";
import { getProjectPath } from "@/lib/project-url";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await projectsAdminService.getAll();
  return projects.flatMap((project) => (project.slug ? [{ slug: project.slug }] : []));
}

async function getProject(slug: string): Promise<Project | null> {
  const projects = await projectsAdminService.getAll();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "ไม่พบผลงาน | Siamrooftech", robots: { index: false, follow: false } };

  const projectPath = getProjectPath(project);
  if (!projectPath) return { title: "ไม่พบผลงาน | Siamrooftech", robots: { index: false, follow: false } };

  const title = `ผลงานกันสาดพับเก็บได้ ${project.location} | Siamrooftech`;
  const description = `ผลงานติดตั้งกันสาดระบบ${project.type} ขนาด ${project.width} × ${project.extension} เมตร ที่${project.location}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(projectPath) },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl(projectPath),
      images: project.featured_image ? [{ url: project.featured_image, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(project.featured_image ? { images: [project.featured_image] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const projects = await projectsAdminService.getAll();
  const project = projects.find((item) => item.slug === slug);
  if (!project || !getProjectPath(project)) notFound();

  const relatedProjects = [...projects].sort((a, b) => {
    if (a.category === project.category && b.category !== project.category) return -1;
    if (b.category === project.category && a.category !== project.category) return 1;
    return 0;
  });

  return <ProjectDetailClient project={project} allProjects={relatedProjects} />;
}
