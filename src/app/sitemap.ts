import type { MetadataRoute } from 'next'
import type { Project } from '@/features/projects/types';
import { projectsRepository } from '@/features/projects/server/repository'
import { getPublishedArticles } from '@/features/articles/server/repository'
import { articlePath } from '@/features/articles/article-path'
import { canonicalUrl, toDate } from '../lib/seo-config'
import { servicePages } from '../lib/service-pages'
import { getProjectPath } from '../lib/project-url'

export const dynamic = 'force-dynamic';

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
  const [projects, articles]: [Project[], Awaited<ReturnType<typeof getPublishedArticles>>] = await Promise.all([
    projectsRepository.getAll(),
    getPublishedArticles(),
  ]);

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
    const lastModified = toDate(article.modifiedAt);
    return {
      url: canonicalUrl(articlePath(article.metadata.slug)),
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
