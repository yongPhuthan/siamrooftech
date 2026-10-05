import type { MetadataRoute } from 'next'
import type { Article, Project } from '../lib/firestore'
import { articlesAdminService, projectsAdminService } from '../lib/firestore-admin'
import { getArticleRouteSlug } from '../lib/articles/slug-generator'
import { canonicalUrl, toDate } from '../lib/seo-config'
import { servicePages } from '../lib/service-pages'
import { getProjectPath } from '../lib/project-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    {
      url: canonicalUrl('/'),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: canonicalUrl('/contact'),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: canonicalUrl('/projects'),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: canonicalUrl('/articles'),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // Fetch actual projects for sitemap
  let projects: Project[] = [];
  let articles: Article[] = [];
  
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

  // Dynamic project detail pages
  const projectLastModified = (project: Project): Date | undefined =>
    toDate(project.updated_at) ?? toDate(project.created_at);

  const projectPages = projects.flatMap((project) => {
    const path = getProjectPath(project);
    if (!path) return [];
    const lastModified = projectLastModified(project);
    return {
      url: canonicalUrl(path),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    };
  });

  const articlePages = articles.map((article) => {
    const lastModified =
      toDate(article.lastModified) ??
      toDate(article.updated_at) ??
      toDate(article.published_at) ??
      toDate(article.created_at);

    return {
      url: canonicalUrl(`/articles/${getArticleRouteSlug(article)}`),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    };
  });

  const serviceLandingPages = servicePages.map((page) => ({
    url: canonicalUrl(page.slug),
    changeFrequency: 'monthly' as const,
    priority: page.kind === 'service' ? 0.9 : 0.8,
  }));

  return [...staticPages, ...serviceLandingPages, ...projectPages, ...articlePages]
}
