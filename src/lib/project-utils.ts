import type { Project } from '@/features/projects/types';

// Interface สำหรับ format ที่ ProjectShow component ใช้
export interface ProjectShowData {
  id: number;
  title: string[];
  subtitle?: string;
  description: string[];
  items: ProjectShowItem[];
  projectId?: string; // เพิ่มสำหรับ navigation
  projectSlug?: string; // เพิ่มสำหรับ navigation
}

export interface ProjectShowItem {
  id: number;
  title: string;
  description: string;
  smallSize: string;
  originalSize: string;
}

// Transform published project records into the format used by the homepage gallery.
export function transformProjectsToProjectShow(
  projects: Project[], 
  keyword: string,
  limit?: number
): { projectShowData: ProjectShowData[], hasMore: boolean } {
  
  // จำกัดจำนวนโปรเจกต์ก่อนการแปลง
  const hasMore = limit ? projects.length > limit : false;
  const limitedProjects = limit ? projects.slice(0, limit) : projects;
  
  // สร้าง ProjectShowData แยกตามแต่ละโปรเจกต์
  const projectShowData: ProjectShowData[] = [];
  let projectId = 1;

  limitedProjects.forEach(project => {
    const projectItems: ProjectShowItem[] = [];
    let itemId = 1;

    // สร้าง items จากรูปภาพของโปรเจกต์นี้
    if (project.images && project.images.length > 0) {
      project.images.forEach(image => {
        projectItems.push({
          id: itemId++,
          title: `${keyword} ${project.category || project.location}`,
          description: Array.isArray(project.description) 
            ? project.description.join(' ') 
            : (project.description || `${project.location} - ${project.type}`),
          smallSize: image.small_size,
          originalSize: image.original_size
        });
      });
    } else if (project.featured_image) {
      // ถ้าไม่มี images array ให้ใช้ featured_image
      projectItems.push({
        id: itemId++,
        title: `${keyword} ${project.category || project.location}`,
        description: Array.isArray(project.description) 
          ? project.description.join(' ') 
          : (project.description || `${project.location} - ${project.type}`),
        smallSize: project.featured_image,
        originalSize: project.featured_image
      });
    }

    // สร้าง ProjectShowData สำหรับโปรเจกต์นี้ (ถ้ามีรูปภาพ)
    if (projectItems.length > 0) {
      projectShowData.push({
        id: projectId++,
        title: [keyword + ' ', project.category === 'อื่นๆ' ? project.location : project.category || 'โปรเจกต์'],
        subtitle: `${project.type || 'กันสาดพับได้'} หน้ากว้าง ${project.width} เมตร x ระยะแขนพับ ${project.extension} เมตร`,
        description: [
          `สถานที่ : ${project.location || 'ไม่ระบุ'}`,
          `ประเภท : ${project.type || project.category || 'กันสาดพับได้'}`,
          `ขนาด : กว้าง ${project.width} cm x ยื่นออก ${project.extension} cm`,
          `วัสดุ : ${project.canvas_material || 'ผ้าอะคริลิคสเปนคุณภาพสูง'}`
        ],
        items: projectItems,
        projectId: project.id,
        projectSlug: project.slug
      });
    }
  });

  // Empty CMS data should stay empty; stale hard-coded projects must not look published.
  if (projectShowData.length === 0) {
    return { projectShowData: [], hasMore: false };
  }

  return { projectShowData, hasMore };
}
