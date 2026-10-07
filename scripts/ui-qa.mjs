import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const publicFiles = [
  ...walk(join(root, 'src/app')),
  ...walk(join(root, 'src/components/site')),
  ...walk(join(root, 'src/components/ui/public')),
  ...walk(join(root, 'src/features/line-contact')),
].filter((path) => /\.(tsx|ts|css|module\.css)$/.test(path) && !relative(root, path).includes('/admin/'));
const publicOwners = [join(root, 'src/components/ui/public'), join(root, 'src/components/site')];

for (const directory of publicOwners) {
  for (const file of walk(directory).filter((path) => /\.(tsx|ts)$/.test(path))) {
    const source = readFileSync(file, 'utf8');
    const relativePath = relative(root, file);
    const isExistingNavigationBoundary = relativePath === 'src/components/site/Navigation.tsx';
    if (!isExistingNavigationBoundary && /(^|\n)['"]use client['"]/.test(source)) {
      failures.push(`${relativePath}: shared public primitives/patterns must stay server-safe unless listed as a pre-existing boundary`);
    }
    if (/from ['"](?:@\/lib\/database|@\/features\/(?:projects|articles)\/server)/.test(source)) {
      failures.push(`${relativePath}: shared UI must not own CMS access`);
    }
  }
}

const clientBoundaryDoc = readFileSync(join(root, 'docs/design-system/PUBLIC_CLIENT_BOUNDARIES.md'), 'utf8');
for (const file of publicFiles.filter((path) => /\.(tsx|ts)$/.test(path))) {
  const source = readFileSync(file, 'utf8');
  const relativePath = relative(root, file);
  if (/(^|\n)['"]use client['"]/.test(source) && !clientBoundaryDoc.includes(`\`${relativePath}\``)) {
    failures.push(`${relativePath}: public client boundary is missing from PUBLIC_CLIENT_BOUNDARIES.md`);
  }
  if (/from ['"](?:lucide-react|@fortawesome\/react-fontawesome)/.test(source)) {
    failures.push(`${relativePath}: public UI icons must use Phosphor SSR through PublicIcon`);
  }
  if (/^import\s+(?!type\b)[^;\n]+\s+from\s+['"]@phosphor-icons\/react['"]/m.test(source)) {
    failures.push(`${relativePath}: runtime Phosphor imports must use @phosphor-icons/react/dist/ssr`);
  }
}

// ContactForm has no consumers (verified in repository import inventory); keep its legacy styling documented until it is revived or removed.
const unusedLegacyFiles = new Set(['src/app/components/ui/ContactForm.tsx']);
for (const file of publicFiles.filter((path) => /\.(tsx|ts|css|module\.css)$/.test(path))) {
  const relativePath = relative(root, file);
  if (relativePath === 'src/app/globals.css' || unusedLegacyFiles.has(relativePath)) continue;
  const source = readFileSync(file, 'utf8');
  if (/(^|[^%])#[\da-fA-F]{3,8}\b/.test(source)) {
    failures.push(`${relativePath}: move hard-coded public colors into site tokens or named visual recipes`);
  }
}

const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
for (const token of ['--color-site-background', '--color-site-brand', '--color-site-ink', '--radius-site-action']) {
  if (!globals.includes(token)) failures.push(`globals.css: missing ${token}`);
}
for (const palette of ['gray', 'slate', 'neutral', 'blue', 'sky']) {
  if (!globals.includes(`--color-${palette}-`)) failures.push(`globals.css: missing scoped ${palette} bridge for legacy public classes`);
}

const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8');
if (!agents.includes('theme tokens') || !agents.includes('server-safe primitive') || !agents.includes('reusable site pattern')) {
  failures.push('AGENTS.md: missing public UI ownership order');
}
if (!agents.includes('Phosphor')) failures.push('AGENTS.md: public Phosphor icon rule is missing');

for (const routeFile of [
  'src/app/components/HomePageContent.tsx',
  'src/app/services/[slug]/page.tsx',
  'src/app/articles/page.tsx',
  'src/app/articles/[slug]/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/projects/page.tsx',
  'src/app/lp/google-ads/electric-awning/page.tsx',
]) {
  const path = join(root, routeFile);
  if (existsSync(path) && !readFileSync(path, 'utf8').includes('data-site-theme')) {
    failures.push(`${routeFile}: public route must scope its public theme with data-site-theme`);
  }
}

const oldBreadcrumbConsumer = publicFiles.find((file) => readFileSync(file, 'utf8').includes('components/ui/Breadcrumbs'));
if (oldBreadcrumbConsumer) failures.push(`${relative(root, oldBreadcrumbConsumer)}: use @/components/site/Breadcrumbs`);

if (failures.length) {
  console.error('ui:qa failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`ui:qa passed: ${publicFiles.length} public files checked; theme scope, shared owners, Phosphor rule, and color tokens are in place.`);
