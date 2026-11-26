import { unstable_cache } from 'next/cache';
import type { Project } from '@/features/projects/types';
import { projectsRepository } from '@/features/projects/server/repository';
import { orderedProjectImages, projectCover, projectHeading, projectName } from '@/features/projects/project-presentation';
import { getProjectPath } from './project-url';
import { ServicePage } from './service-pages';
import { matchesServiceLocation } from './service-linking';

export type ServiceProofProject = {
  id: string;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
  chips: string[];
};

export const fetchServiceProofProjects = unstable_cache(
  async (): Promise<Project[]> => {
    try {
      const projects = await projectsRepository.getAll();
      return projects || [];
    } catch (error) {
      console.error('Error fetching service proof projects:', error);
      return [];
    }
  },
  ['service-proof-projects'],
  { revalidate: 3600, tags: ['projects'] }
);

export function getMatchingProofProjects(
  page: ServicePage,
  projects: Project[],
  limit = 3
): ServiceProofProject[] {
  return projects
    .filter((project) => matchesServicePage(page, project))
    .slice(0, limit)
    .map(toServiceProofProject);
}

function matchesServicePage(page: ServicePage, project: Project): boolean {
  if (!hasUsableImage(project)) return false;

  if (page.slug === '/services/electric-retractable-awning') {
    return Boolean(project.type?.includes('มอเตอร์') || project.type?.includes('ไฟฟ้า'));
  }

  if (page.location) {
    return matchesServiceLocation(page.location, project.location);
  }

  return true;
}

function hasUsableImage(project: Project): boolean {
  return Boolean(project.featured_image || project.images?.[0]?.original_size);
}

function toServiceProofProject(project: Project): ServiceProofProject {
  const [cover] = orderedProjectImages(project);
  const title = projectName(project);
  return {
    id: project.id,
    title,
    href: getProjectPath(project) ?? '/projects',
    image: projectCover(project) || '/images/default-project.jpg',
    imageAlt: cover?.alt_text || projectHeading(project),
    chips: project.type ? [project.type] : [],
  };
}
