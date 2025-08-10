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
    // {
    //   url: `${baseUrl}/contact`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly' as const,
    //   priority: 0.8,
    // },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    // {
    //   url: `${baseUrl}/works`,
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/articles`,
    //   lastModified: new Date(),
    //   changeFrequency: 'daily' as const,
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/allawning`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly' as const,
    //   priority: 0.7,
    // },
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


  // Dynamic portfolio pages
  const portfolioPages = projects.map((project) => ({
    url: `${baseUrl}/portfolio/${project.slug || project.id}`,
    lastModified: new Date(project.updated_at || project.created_at || new Date()),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...portfolioPages]
}