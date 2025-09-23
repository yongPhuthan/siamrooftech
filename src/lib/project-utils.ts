import { Project } from './firestore';

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

// Utility function แปลงข้อมูลจาก Firestore Project เป็น format ของ ProjectShow
export function transformFirestoreProjectsToProjectShow(
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

  // หากไม่มีข้อมูลจาก Firestore ให้ส่งข้อมูล fallback
  if (projectShowData.length === 0) {
    const fallback = getFallbackProjectShowData(keyword);
    return { projectShowData: fallback, hasMore: false };
  }

  return { projectShowData, hasMore };
}

// ข้อมูล fallback ในกรณีที่ไม่มีข้อมูลจาก Firestore
function getFallbackProjectShowData(keyword: string): ProjectShowData[] {
  return [
    {
      id: 1,
      title: [keyword + ' ', 'อาคาร-สำนักงาน'],
      subtitle: 'สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า) หน้ากว้าง 5.3 เมตร x ระยะแขนพับ 2.5 เมตร',
      description: [
        'สถานที่ : แขวงคลองถนน เขตสายไหม กรุงเทพมหานคร',
        'ประเภท : กันสาด 2 ระบบ มอเตอร์รีโมทและมือหมุนในชุดเดียวกัน',
        'ขนาด : กว้าง 530 cm * ยื่นออก 250 cm',
        'วัสดุ : ผ้าใบอะคริลิคสเปนสีขาว'
      ],
      items: [
        {
          id: 1,
          title: `${keyword} อาคาร-สำนักงาน`,
          description: 'This is a fallback project',
          smallSize: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/small/46570',
          originalSize: 'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/46570'
        }
      ]
    }
  ];
}