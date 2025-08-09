import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Project } from '../../../lib/firestore';
import { projectsAdminService } from '../../../lib/firestore-admin';
import ProjectPageClient from './ProjectPageClient';

// Enable ISR with 60 seconds revalidation
export const revalidate = 60;

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProject(id: string): Promise<Project | null> {
  try {
    return await projectsAdminService.getById(id);
  } catch (error) {
    console.error('Error fetching project:', error);
    // projectsAdminService.getById() now returns fallback data automatically
    return null;
  }
}

async function getRelatedProjects(currentProjectId: string, category: string): Promise<Project[]> {
  try {
    const projects = await projectsAdminService.getByCategory(category);
    return projects.filter(project => project.id !== currentProjectId).slice(0, 3);
  } catch (error) {
    console.error('Error fetching related projects:', error);
    return [];
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  
  if (!project) {
    return {
      title: 'ไม่พบโปรเจค - สยามรูฟเทค',
      description: 'ไม่พบโปรเจคที่คุณต้องการ',
    };
  }
  
  const description = Array.isArray(project.description) ? project.description.join(' ') : project.description;
  const image = project.featured_image || project.images?.[0]?.original_size || '/images/default-project.jpg';
  
  return {
    title: `${project.title} - ผลงานติดตั้งกันสาดพับเก็บได้ | สยามรูฟเทค`,
    description,
    keywords: `${project.title}, กันสาดพับเก็บได้, ${project.category}, ${project.type}, สยามรูฟเทค`,
    openGraph: {
      title: `${project.title} - ผลงานติดตั้งกันสาดพับเก็บได้`,
      description,
      images: [image],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const relatedProjects = await getRelatedProjects(id, project.category);

  return <ProjectPageClient project={project} relatedProjects={relatedProjects} />;
}