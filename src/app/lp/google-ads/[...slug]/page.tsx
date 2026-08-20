import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ServiceLandingPage from '@/app/components/services/ServiceLandingPage';
import {
  getServicePage,
  servicePageMap,
  servicePageUrl,
  type ServicePage,
} from '@/lib/service-pages';
import {
  fetchServiceProofProjects,
  getMatchingProofProjects,
} from '@/lib/service-project-matching';
import {
  resolveGoogleAdsDynamicContent,
  type SearchParamsLike,
} from '@/lib/google-ads-dynamic-content';

export const dynamic = 'force-dynamic';

const GOOGLE_ADS_SERVICE_SLUGS = new Set([
  '/services/retractable-awning',
  '/services/electric-retractable-awning',
  '/services/retractable-awning/bangkok',
  '/services/retractable-awning/nonthaburi',
  '/services/retractable-awning/pathum-thani',
]);

type GoogleAdsLandingPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams?: Promise<SearchParamsLike>;
};

function serviceSlugFromSegments(segments: string[] = []): string {
  return `/services/${segments.join('/')}`;
}

function findGoogleAdsServicePage(segments: string[] = []): ServicePage | null {
  const serviceSlug = serviceSlugFromSegments(segments);

  if (!GOOGLE_ADS_SERVICE_SLUGS.has(serviceSlug) || !servicePageMap.has(serviceSlug)) {
    return null;
  }

  return getServicePage(serviceSlug);
}

export async function generateMetadata({
  params,
}: Pick<GoogleAdsLandingPageProps, 'params'>): Promise<Metadata> {
  const page = findGoogleAdsServicePage((await params).slug);

  if (!page) {
    return {};
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: servicePageUrl(page.slug),
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: servicePageUrl(page.slug),
      type: 'website',
      images: [
        {
          url: page.image,
          width: 1200,
          height: 800,
          alt: page.imageAlt,
        },
      ],
    },
  };
}

export default async function GoogleAdsLandingPage({
  params,
  searchParams,
}: GoogleAdsLandingPageProps) {
  const page = findGoogleAdsServicePage((await params).slug);

  if (!page) {
    notFound();
  }

  const resolvedSearchParams = await (searchParams || Promise.resolve({}));
  const projects = await fetchServiceProofProjects();
  const proofProjects = getMatchingProofProjects(page, projects);
  const dynamicContent = resolveGoogleAdsDynamicContent(page, resolvedSearchParams);

  return (
    <ServiceLandingPage
      page={page}
      proofProjects={proofProjects}
      dynamicContent={dynamicContent}
    />
  );
}
