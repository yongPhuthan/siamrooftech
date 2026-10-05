import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/firestore";
import { getProjectPath } from "@/lib/project-url";
import styles from "./projects-index.module.css";

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

      <p className="mb-5 text-center text-sm text-gray-600">
        แสดงผลงานติดตั้งจริงทั้งหมด {projects.length} รายการ
      </p>

      <div className={styles.grid}>
        {projects.map((project) => {
          const projectPath = getProjectPath(project);
          if (!projectPath) return null;
          const categoryIndex = categories.indexOf(project.category) + 1;
          const image = project.featured_image || project.images?.[0]?.medium_size || project.images?.[0]?.original_size;
          if (!image) return null;

          return (
            <Link
              className={`${styles.card} group`}
              data-category-index={categoryIndex}
              href={projectPath}
              key={project.id}
            >
              <article className="h-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/70 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <Image
                    src={image}
                    alt={project.images?.[0]?.alt_text || `ผลงานติดตั้งกันสาด ${project.title}`}
                    fill
                    priority={projects.indexOf(project) === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                    {project.category}
                  </span>
                  <span className="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-gray-800">
                    {project.images?.length || 1} รูป
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900">กันสาดพับเก็บได้ {project.width} × {project.extension} ม.</h2>
                  <p className="mt-1 text-sm text-gray-600">{project.location} · {project.year}</p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-700">
                    {Array.isArray(project.description) ? project.description[0] : project.description}
                  </p>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
