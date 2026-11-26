import Image from "next/image";
import Link from "next/link";
import type { Project } from '@/features/projects/types';
import { getProjectPath } from "@/lib/project-url";
import { PublicBadge, PublicCard, PublicHeading } from '@/components/ui/public';
import styles from "./projects-index.module.css";
import { projectCover, projectHeading, projectName, projectSize } from '@/features/projects/project-presentation';

/** System and size when the project has them; nothing when it is a photo-only project. */
function details(project: Project): string {
  return [project.type, projectSize(project)].filter(Boolean).join(' · ');
}

interface ProjectsIndexProps {
  projects: Project[];
}

export default function ProjectsIndex({ projects }: ProjectsIndexProps) {
  const categories = [...new Set(projects.map((project) => project.category))].sort((a, b) => a.localeCompare(b, "th"));

  return (
    <section className={styles.listing} aria-label="รายการผลงาน">
      <fieldset className="mb-8">
        <legend className="sr-only">กรองผลงานตามหมวดหมู่</legend>
        <div className="flex flex-wrap justify-center gap-2">
          <input
            className={styles.filterInput}
            type="radio"
            name="project-category"
            id="project-filter-all"
            defaultChecked
          />
          <label className={styles.filterLabel} htmlFor="project-filter-all">
            ทั้งหมด <span>{projects.length}</span>
          </label>
          {categories.map((category, index) => {
            const categoryId = index + 1;
            const count = projects.filter((project) => project.category === category).length;
            return (
              <div className="contents" key={category}>
                <input
                  className={styles.filterInput}
                  type="radio"
                  name="project-category"
                  id={`project-filter-${categoryId}`}
                />
                <label className={styles.filterLabel} htmlFor={`project-filter-${categoryId}`}>
                  {category} <span>{count}</span>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <p className="mb-5 text-center text-sm text-site-muted">
        แสดงผลงานติดตั้งจริงทั้งหมด {projects.length} รายการ
      </p>

      <div className={styles.grid}>
        {projects.map((project) => {
          const projectPath = getProjectPath(project);
          if (!projectPath) return null;
          const categoryIndex = categories.indexOf(project.category) + 1;
          const image = projectCover(project);
          if (!image) return null;

          return (
            <Link
              className={`${styles.card} group`}
              data-category-index={categoryIndex}
              href={projectPath}
              key={project.id}
            >
              <PublicCard variant="interactive" className="h-full">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <Image
                    src={image}
                    alt={project.images?.[0]?.alt_text || projectHeading(project)}
                    fill
                    priority={projects.indexOf(project) === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <PublicBadge className="absolute right-3 top-3 bg-white/95 text-site-ink">
                    {project.images?.length || 1} รูป
                  </PublicBadge>
                </div>
                <div className="p-4">
                  <PublicHeading as="h2" level="panel" className="line-clamp-2 text-lg">{projectName(project)}</PublicHeading>
                  {details(project) && <p className="mt-1 text-sm text-site-muted">{details(project)}</p>}
                </div>
              </PublicCard>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
