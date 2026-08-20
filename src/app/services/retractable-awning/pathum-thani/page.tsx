import type { Metadata } from 'next';
import ServiceLandingPage from '@/app/components/services/ServiceLandingPage';
import { getServicePage, servicePageUrl } from '@/lib/service-pages';
import { fetchServiceProofProjects, getMatchingProofProjects } from '@/lib/service-project-matching';

const page = getServicePage('/services/retractable-awning/pathum-thani');

export const metadata: Metadata = {
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

export default async function PathumThaniRetractableAwningPage() {
  const projects = await fetchServiceProofProjects();
  const proofProjects = getMatchingProofProjects(page, projects);

  return <ServiceLandingPage page={page} proofProjects={proofProjects} />;
}
