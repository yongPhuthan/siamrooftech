import { fileProjects } from "../data/projects";
import { Project } from "./firestore";

function projectDate(project: Project): number {
  if (project.completionDate) {
    return new Date(project.completionDate).getTime();
  }
  if (project.created_at) {
    return new Date(project.created_at).getTime();
  }
  return new Date(Number(project.year), 0).getTime();
}

function byNewest(a: Project, b: Project): number {
  const aTime = projectDate(a);
  const bTime = projectDate(b);
  if (aTime === bTime) return 0;
  return bTime - aTime;
}

export function validateFileProjects(projects: Project[] = fileProjects): void {
  const errors: string[] = [];
  const slugs = new Map<string, string>();

  projects.forEach((project) => {
    if (!project.id) errors.push("project missing id");
    if (!project.slug) errors.push(`${project.id}: missing slug`);
    if (!project.title) errors.push(`${project.id}: missing title`);
    if (!project.category) errors.push(`${project.id}: missing category`);
    if (!project.location) errors.push(`${project.id}: missing location`);

    if (project.slug) {
      const owner = slugs.get(project.slug);
      if (owner) errors.push(`${project.id}: duplicate slug with ${owner}`);
      slugs.set(project.slug, project.id);
    }

    const images = Array.isArray(project.images) ? project.images : [];
    if (!images.length) errors.push(`${project.id}: missing images`);
    if (!project.featured_image) errors.push(`${project.id}: missing featured_image`);
    if (project.featured_image?.includes("default-project.jpg")) {
      errors.push(`${project.id}: default-project.jpg is not allowed`);
    }

    const projectImages = new Set<string>();
    images.forEach((image) => {
      const url = image.original_size || image.small_size;
      if (!image.id) errors.push(`${project.id}: image missing id`);
      if (!image.original_size) errors.push(`${project.id}/${image.id}: missing original_size`);
      if (!image.small_size) errors.push(`${project.id}/${image.id}: missing small_size`);
      if (url?.includes("default-project.jpg")) {
        errors.push(`${project.id}/${image.id}: default-project.jpg is not allowed`);
      }
      if (url && projectImages.has(url)) {
        errors.push(`${project.id}/${image.id}: duplicate image URL inside project`);
      }
      if (url) projectImages.add(url);
    });
  });

  if (errors.length > 0) {
    throw new Error(`Invalid file-based projects:\n${errors.join("\n")}`);
  }
}

validateFileProjects();

export const fileProjectsService = {
  getAll(): Project[] {
    return [...fileProjects].sort(byNewest);
  },

  getById(id: string): Project | null {
    return fileProjects.find((project) => project.id === id) || null;
  },

  getBySlug(slug: string): Project | null {
    const normalizedSlug = slug.toLowerCase();
    return (
      fileProjects.find((project) => project.slug?.toLowerCase() === normalizedSlug) ||
      null
    );
  },

  getByCategory(category: string): Project[] {
    return fileProjects
      .filter((project) => project.category === category)
      .sort(byNewest);
  },

  getRelatedProjects(projectIds: string[]): Project[] {
    if (projectIds.length === 0) return [];
    const ids = new Set(projectIds);
    return fileProjects.filter((project) => ids.has(project.id));
  },
};
