import { Project } from './firestore';

const LOCATION_ALIASES: Record<string, string[]> = {
  กรุงเทพ: ['กรุงเทพ', 'กรุงเทพมหานคร', 'bangkok'],
  นนทบุรี: ['นนทบุรี', 'nonthaburi'],
  ปทุมธานี: ['ปทุมธานี', 'pathum'],
};

export function getServiceLinksForProject(project: Project) {
  const links = [
    {
      href: '/services/retractable-awning',
      label: 'กันสาดพับเก็บได้',
    },
  ];

  if (project.type?.includes('มอเตอร์') || project.type?.includes('ไฟฟ้า')) {
    links.push({
      href: '/services/electric-retractable-awning',
      label: 'กันสาดพับไฟฟ้า',
    });
  }

  const localService = getLocalServiceForProject(project);
  if (localService) {
    links.push(localService);
  }

  return links;
}

export function matchesServiceLocation(location: string, projectLocation = ''): boolean {
  const aliases = LOCATION_ALIASES[location] || [location];
  const normalizedLocation = projectLocation.toLowerCase();

  return aliases.some((alias) => normalizedLocation.includes(alias.toLowerCase()));
}

function getLocalServiceForProject(project: Project) {
  const localPages = [
    {
      location: 'กรุงเทพ',
      href: '/services/retractable-awning/bangkok',
      label: 'กันสาดพับเก็บได้ กรุงเทพ',
    },
    {
      location: 'นนทบุรี',
      href: '/services/retractable-awning/nonthaburi',
      label: 'กันสาดพับเก็บได้ นนทบุรี',
    },
    {
      location: 'ปทุมธานี',
      href: '/services/retractable-awning/pathum-thani',
      label: 'กันสาดพับเก็บได้ ปทุมธานี',
    },
  ];

  return localPages.find((page) => matchesServiceLocation(page.location, project.location));
}
