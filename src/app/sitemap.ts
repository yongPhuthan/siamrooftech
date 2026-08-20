import { MetadataRoute } from 'next'
import { articlesAdminService, projectsAdminService } from '../lib/firestore-admin'
import { getArticleRouteSlug } from '../lib/articles/slug-generator'
import { canonicalUrl, toDate } from '../lib/seo-config'
import { servicePages } from '../lib/service-pages'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    {
      url: canonicalUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: canonicalUrl('/contact'),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: canonicalUrl('/portfolio'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: canonicalUrl('/works'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: canonicalUrl('/articles'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: canonicalUrl('/allawning'),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ]

  // Fetch actual projects for sitemap
  let projects: any[] = [];
  let articles: any[] = [];
  
  try {
    projects = await projectsAdminService.getAll();
  } catch (error) {
    console.error('Error fetching projects for sitemap:', error);
  }

  try {
    const allArticles = await articlesAdminService.getAll();
    articles = allArticles.filter((article) => article.isPublished === true);
  } catch (error) {
    console.error('Error fetching articles for sitemap:', error);
  }

  // Dynamic portfolio pages
  const portfolioPages = projects.map((project) => ({
    url: canonicalUrl(`/portfolio/${project.slug || project.id}`),
    lastModified: toDate(project.updated_at || project.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const portfolioCategoryPages = [...new Set(projects.map((project) => project.category).filter(Boolean))].map((category) => ({
    url: canonicalUrl(`/portfolio/category/${encodeURIComponent(String(category))}`),
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const articlePages = articles.map((article) => ({
    url: canonicalUrl(`/articles/${getArticleRouteSlug(article)}`),
    lastModified: toDate(article.lastModified || article.updated_at || article.published_at || article.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const serviceLandingPages = servicePages.map((page) => ({
    url: canonicalUrl(page.slug),
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: page.kind === 'service' ? 0.9 : 0.8,
  }));

  return [...staticPages, ...serviceLandingPages, ...portfolioPages, ...portfolioCategoryPages, ...articlePages]
}
