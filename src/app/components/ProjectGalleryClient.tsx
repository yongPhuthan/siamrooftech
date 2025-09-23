'use client';

import { useState, useCallback } from 'react';
import ProjectShow from './section/ProjectShow';
import ImageGalleryModal from './section/ImageGalleryModal';
import { ProjectShowData } from '@/lib/project-utils';

type Props = {
  projects: ProjectShowData[];
};

const ProjectGalleryClient = ({ projects }: Props) => {
  const [cataloqImages, setCataloqImages] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(
    (projectId: number) => {
      const selectedProject = projects.find(
        (proj) => proj.id === projectId
      );
      if (selectedProject) {
        setCataloqImages(
          selectedProject.items.map((item) => item.originalSize)
        );
        setOpen(true);
      }
    },
    [projects]
  );

  const handleClose = () => setOpen(false);

  return (
    <>
      {projects.map((project) => (
        <ProjectShow
          key={project.id}
          projectShows={project.items}
          cataloqImages={project.items.map((item) => item.originalSize)}
          handleOpen={() => handleOpen(project.id)}
          title={project.title}
          subtitle={project.subtitle}
          description={project.description}
        />
      ))}
      <ImageGalleryModal
        open={open}
        handleClose={handleClose}
        cataloqImages={cataloqImages}
      />
    </>
  );
};

export default ProjectGalleryClient;