import { unstable_cache } from 'next/cache';
import { Project } from './firestore';
import { projectsAdminService } from './firestore-admin';
import { getProjectProof, hasManualProjectProof } from './project-proof';
import { ServicePage } from './service-pages';
import { matchesServiceLocation } from './service-linking';

export type ServiceProofProject = {
  id: string;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
  location: string;
  category: string;
  type: string;
  dimensions: string;
  material: string;
  problem: string;
  solution: string;
  outcome: string;
  proofNotes: string[];
  hasManualProof: boolean;
};

export const fetchServiceProofProjects = unstable_cache(
  async (): Promise<Project[]> => {
    try {
      const projects = await projectsAdminService.getAll();
      return projects || [];
    } catch (error) {
      console.error('Error fetching service proof projects:', error);
      return [];
    }
  },
  ['service-proof-projects'],
  { revalidate: 3600 }
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
    return project.type?.includes('มอเตอร์') || project.type?.includes('ไฟฟ้า');
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
  const proof = getProjectProof(project);
  const image = project.featured_image || project.images?.[0]?.original_size || '/images/default-project.jpg';

  return {
    id: project.id,
    title: project.title || `${project.type} ${project.location}`,
    href: `/portfolio/${project.slug || project.id}`,
    image,
    imageAlt: project.images?.[0]?.alt_text || `ผลงานกันสาดพับเก็บได้ ${project.location}`,
    location: proof.location,
    category: proof.category,
    type: proof.serviceType,
    dimensions: proof.dimensions,
    material: proof.material,
    problem: proof.problem,
    solution: proof.solution,
    outcome: proof.outcome,
    proofNotes: proof.notes,
    hasManualProof: hasManualProjectProof(project),
  };
}
