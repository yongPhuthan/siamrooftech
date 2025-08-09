import { MetadataRoute } from 'next'
import { projectsAdminService } from '../lib/firestore-admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.siamrooftech.com'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/works`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/allawning`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ]

  // Fetch actual projects for sitemap
  let projects: any[] = [];
  let categories: string[] = [];
  
  try {
    projects = await projectsAdminService.getAll();
    categories = [...new Set(projects.map(p => p.category))];
  } catch (error) {
    console.error('Error fetching projects for sitemap:', error);
  }

  // Mock dynamic articles - replace with actual data fetching when articles are implemented
  const mockArticles = [
    '5-เหตุผลที่ควรเลือกกันสาดพับเก็บได้สำหรับร้านอาหาร',
    'วิธีการดูแลรักษากันสาดพับเก็บได้ให้ใช้งานได้นาน',
    'เปรียบเทียบกันสาดพับเก็บได้ระบบมือหมุน-vs-มอเตอร์ไฟฟ้า'
  ]

  // Dynamic article pages
  const articlePages = mockArticles.map((slug) => ({
    url: `${baseUrl}/articles/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Dynamic portfolio pages
  const portfolioPages = projects.map((project) => ({
    url: `${baseUrl}/portfolio/${project.slug || project.id}`,
    lastModified: new Date(project.updated_at || project.created_at || new Date()),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Portfolio category pages
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/portfolio/category/${encodeURIComponent(category)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Legacy project pages (for backwards compatibility)
  const legacyProjectPages = projects.map((project) => ({
    url: `${baseUrl}/works/${project.id}`,
    lastModified: new Date(project.updated_at || project.created_at || new Date()),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...articlePages, ...portfolioPages, ...categoryPages, ...legacyProjectPages]
}