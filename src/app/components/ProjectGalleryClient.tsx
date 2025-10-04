'use client';

import ProjectShow from './section/ProjectShow';
import { ProjectShowData } from '@/lib/project-utils';

type Props = {
  projects: ProjectShowData[];
};

const ProjectGalleryClient = ({ projects }: Props) => {
  return (
    <>
      {projects.map((project) => (
        <ProjectShow
          key={project.id}
          projectShows={project.items}
          title={project.title}
          subtitle={project.subtitle}
          description={project.description}
          projectId={project.projectId}
          projectSlug={project.projectSlug}
        />
      ))}
    </>
  );
};

export default ProjectGalleryClient;