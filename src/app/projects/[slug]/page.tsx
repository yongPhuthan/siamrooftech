import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import ProjectDetailClient from "../../components/projects/ProjectDetailClient";
import type { Project } from '@/features/projects/types';
import { projectsRepository, getPublishedProjectBySlug } from "@/features/projects/server/repository";
import { canonicalUrl } from "@/lib/seo-config";
import { getProjectPath } from "@/lib/project-url";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

// ISR: rendered on the first request from the deployment's own D1, then cached
// until a publish/unpublish invalidates it (see revalidatePublicContent).
// generateStaticParams returns [] so no CMS data is baked in at build time.
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

const RELATED_PROJECT_LIMIT = 3;

// generateMetadata and the page run in the same request; share one D1 read.
const getProject = cache(async (slug: string): Promise<Project | null> => getPublishedProjectBySlug(slug));

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
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const [projects, project] = await Promise.all([projectsRepository.getAll(), getProject(slug)]);
  if (!project || !getProjectPath(project)) notFound();

  const relatedProjects = [...projects].sort((a, b) => {
    if (a.category === project.category && b.category !== project.category) return -1;
    if (b.category === project.category && a.category !== project.category) return 1;
    return 0;
  }).filter((related) => related.id !== project.id).slice(0, RELATED_PROJECT_LIMIT);

  // Only the related cards cross the client boundary, keeping the RSC payload small.
  return <ProjectDetailClient project={project} allProjects={relatedProjects} />;
}
