import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { PublicContainer } from "@/components/ui/public";
import ProjectGallery from "../../components/projects/ProjectGallery";
import ProjectVideos from "../../components/projects/ProjectVideos";
import type { Project } from '@/features/projects/types';
import { projectsRepository, getPublishedProjectBySlug } from "@/features/projects/server/repository";
import {
  projectCover,
  projectDescriptionText,
  projectHeading,
  projectMetaDescription,
  orderedProjectImages,
  projectSize,
} from "@/features/projects/project-presentation";
import { getServiceLinksForProject } from "@/lib/service-linking";
import { getVideos, sortVideos } from "@/lib/project-video-utils";
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

  const title = `ผลงาน${projectHeading(project)} | Siamrooftech`;
  const description = projectMetaDescription(project);
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

const chipClass = "inline-flex items-center rounded-site-badge border border-site-border px-3 py-1 text-sm text-site-muted";

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const [projects, project] = await Promise.all([projectsRepository.getAll(), getProject(slug)]);
  const projectPath = project ? getProjectPath(project) : null;
  if (!project || !projectPath) notFound();

  const heading = projectHeading(project);
  const images = orderedProjectImages(project);
  const description = projectDescriptionText(project);
  const size = projectSize(project);
  const videos = sortVideos(getVideos(project));
  // The system chip links to the matching service page when there is one; other chips are plain facts.
  const systemLink = project.type ? getServiceLinksForProject(project).find((link) => link.href.includes('electric')) ?? getServiceLinksForProject(project)[0] : undefined;
  const relatedProjects = [...projects]
    .filter((related) => related.id !== project.id && getProjectPath(related))
    .sort((a, b) => Number(b.category === project.category) - Number(a.category === project.category))
    .slice(0, RELATED_PROJECT_LIMIT);
  const relatedHeading = relatedProjects.some((related) => related.category === project.category) ? `ผลงานอื่นในหมวด${project.category}` : 'ผลงานอื่น';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: heading,
    ...(description ? { description } : {}),
    image: images.map((image) => image.original_size.startsWith('/') ? canonicalUrl(image.original_size) : image.original_size),
    url: canonicalUrl(projectPath),
    about: "กันสาดพับเก็บได้",
    creator: { "@type": "Organization", name: "Siamrooftech", url: canonicalUrl('/') },
    ...(project.created_at ? { datePublished: project.created_at } : {}),
  };

  return (
    <div data-site-theme className="min-h-screen bg-site-surface text-site-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <PublicContainer width="wide">
        <Breadcrumbs className="px-0" items={[{ name: 'หน้าแรก', href: '/' }, { name: 'ผลงานทั้งหมด', href: '/projects' }, { name: heading }]} />

        {/* Phones show the photos first, as in the wireframe; wide screens put the heading above them. */}
        <div className="flex flex-col">
        <header className="order-2 pt-4 md:order-1 md:pb-4 md:pt-0">
          <h1 className="heading-display text-site-ink">{heading}</h1>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="ข้อมูลผลงาน">
            <li className={chipClass}>{project.category}</li>
            {project.type && (
              <li>
                {systemLink ? (
                  <Link href={systemLink.href} className={`${chipClass} hover:border-site-brand hover:text-site-brand-strong`}>{project.type}</Link>
                ) : (
                  <span className={chipClass}>{project.type}</span>
                )}
              </li>
            )}
            {project.fabric_edge && <li className={chipClass}>ขอบผ้า{project.fabric_edge}</li>}
            {size && <li className={chipClass}>{size}</li>}
          </ul>
        </header>

        <div className="order-1 md:order-2">
          <ProjectGallery images={images} title={heading} />
        </div>
        </div>

        {description && <p className="body-copy mt-6 max-w-3xl text-site-muted">{description}</p>}

        {videos.length > 0 && (
          <section className="mt-12">
            <h2 className="heading-section mb-4 text-site-ink">วิดีโอ</h2>
            <ProjectVideos videos={videos} />
          </section>
        )}

        {relatedProjects.length > 0 && (
          <section className="mt-12 pb-16">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="heading-section text-site-ink">{relatedHeading}</h2>
              <Link href="/projects" className="text-sm font-semibold text-site-brand-strong hover:text-site-brand">ดูผลงานทั้งหมด</Link>
            </div>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {relatedProjects.map((related) => {
                const cover = projectCover(related);
                return (
                  <li key={related.id}>
                    <Link href={getProjectPath(related) ?? '/projects'} className="group block">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-site-media bg-site-subtle">
                        {cover && <Image src={cover} alt={related.images?.[0]?.alt_text?.trim() || projectHeading(related)} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </PublicContainer>
    </div>
  );
}
