# Siamrooftech SEO Website - AGENTS.md

## Project Overview
A modern Siamrooftech website for retractable awning services, portfolio showcases, and SEO-optimized articles. Built with TypeScript + Next.js 15 App Router + Firebase. The current application code lives primarily under `src/`, with supporting packages and legacy workspace folders also present.

**CRITICAL: This is an SEO-focused website. Public pages should use SSG/ISR and server rendering. Avoid adding client components; keep only the existing public client boundaries listed in [`docs/design-system/PUBLIC_CLIENT_BOUNDARIES.md`](docs/design-system/PUBLIC_CLIENT_BOUNDARIES.md), and do not expand them for styling. Admin pages may use client rendering.**

## Revenue-Critical LINE Contact Funnel

- The LINE contact feature is owned by `src/features/line-contact/`. Read and obey its nested `AGENTS.md` before changing any LINE CTA, destination, click handling, lead intake, attribution, survey, redirect, or related QA.
- All user-facing LINE contact links outside that folder must import its canonical `LINE_CONTACT_URL`; never hard-code, construct, wrap, or replace the destination elsewhere.
- A working native handoff to `https://lin.ee/pPz1ZqN` takes priority over analytics and attribution. Any change that adds friction or can prevent contact is a release blocker.

## Tech Stack & Commands

### Dependencies (Current Versions)
```json
{
 "@base-ui/react": "^1.5.0",
 "@next/third-parties": "^15.5.9",
 "@react-spring/web": "^9.7.3",
 "@fortawesome/react-fontawesome": "^0.2.0",
 "class-variance-authority": "^0.7.1",
 "clsx": "^2.1.1",
 "firebase": "^12.0.0",
 "firebase-admin": "^13.4.0",
 "lucide-react": "^1.17.0",
 "next": "^15.5.9",
 "react": "^18",
 "react-dom": "^18",
 "shadcn": "^4.11.0",
 "swiper": "^11.0.6",
 "tailwind-merge": "^3.6.0",
 "uuid": "^11.1.0"
}
```

### Primary Commands
```bash
# Development
yarn dev              # Start development server
yarn build           # Build for production
yarn start           # Start production server
yarn type-check      # Run TypeScript type checking
yarn lint            # Run ESLint
yarn lint:fix        # Fix linting issues automatically

# Cache Management (NEW)
npm run revalidate    # Clear Next.js cache only
npm run revalidate:dev # Clear cache + start dev server
npm run clear-cache   # Remove .next/cache directories

# Documentation
yarn docs:sync        # Download latest API docs for current versions
yarn docs:serve       # Serve docs locally at :3001

# Testing (TDD Approach)
yarn test            # Run tests
yarn test:watch      # Run tests in watch mode
yarn test:coverage   # Run tests with coverage report

# Firebase
yarn firebase:emulator    # Start Firebase emulators
yarn firebase:deploy     # Deploy to Firebase
yarn firebase:functions  # Deploy only functions
```

### Monorepo Structure
```
/
├── src/                     # Main Next.js application
│   ├── app/                 # App Router pages, layouts, and public UI
│   ├── components/          # Shared/admin components including shadcn-style UI
│   └── lib/                 # Firebase, SEO, project, and upload utilities
├── public/                  # Static assets
├── scripts/                 # QA, SEO, and maintenance scripts
└── docs/                    # Documentation
```

## Code Style & Standards

### TypeScript & Next.js 15
- **ALWAYS use App Router** (not Pages Router)
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use ES modules (import/export), not CommonJS
- Destructure imports when possible: `import { Component } from 'library'`
- Use proper TypeScript types - avoid `any`

### SEO-First Architecture
- **PUBLIC PAGES**: Use SSG or ISR only - NO client components
- **ADMIN PAGES**: Client components allowed for admin functionality
- Always include proper meta tags, structured data, and Open Graph
- Optimize for Core Web Vitals
- Use semantic HTML structure

### Styling & UI
- **Tailwind CSS utility classes** are the primary styling approach for public pages and admin UI.
- **shadcn-style components** are configured through `components.json` with `rsc: true`, `tsx: true`, `baseColor: neutral`, and aliases such as `@/components/ui` and `@/lib/utils`.
- **@base-ui/react** is available for accessible low-level primitives when a custom component needs robust interaction behavior.
- **Phosphor** (`@phosphor-icons/react/dist/ssr` through `PublicIcon`) is the standard for public UI icons. Admin and legacy consumers may retain their existing icon packages; do not migrate admin as part of public UI work.
- **DaisyUI classes** are still used in parts of the existing UI, especially button classes such as `btn`, `btn-primary`, and `btn-outline`.
- **Do not introduce MUI or Emotion** for new UI. The project no longer depends on `@mui/material`, `@mui/material-nextjs`, or Emotion packages.

### Public UI ownership and reuse
- Before creating a public UI component, search existing owners under `src/components/ui/public` and `src/components/site`; extend a typed variant when the semantics match instead of creating a duplicate.
- Reuse public UI in this order: `site-*` theme tokens → server-safe primitive → reusable site pattern → page or feature composition. Public primitives must not fetch CMS data or contain business rules.
- Keep admin UI on its existing `src/components/ui` API. Public components must not import client-only primitives or add `use client` merely for styling.
- Shared public components must use semantic HTML and preserve keyboard, focus, label, and landmark behavior. A `className` prop is for layout extension; colors, typography, radius, and shadows belong to tokens or named variants.
- Feature-specific composition belongs with the feature. Share a component only when it has more than one real consumer and the semantics are the same; visual similarity alone is insufficient.
- Existing public client boundaries are documented exceptions. Do not expand them for styling or layout work.

### Design System
**IMPORTANT: Before making UI changes to project-related components, ALWAYS consult:**
- [`/docs/design-system/PROJECT_UI_DESIGN.md`](/docs/design-system/PROJECT_UI_DESIGN.md) - Comprehensive design patterns and component library
- [`/docs/design-system/PUBLIC_UI_DESIGN.md`](/docs/design-system/PUBLIC_UI_DESIGN.md) - Public theme tokens, owners, variants, and composition rules

This design system ensures consistency across:
- **ProjectShow** (Homepage featured projects)
- **Portfolio Grid & Cards** (Portfolio listing pages)
- **Portfolio Detail Pages** (Individual project pages)
- **Filter Chips** (Category filtering)
- **Navigation Components** (Breadcrumbs, CTAs)

**Key Design Principles:**
- Public theme: Slate background/surfaces, subtle borders and shadows, Blue/Sky accents; use `site-*` tokens and named visual variants.
- Typography: Sukhumvit Set font family with bold headings
- Spacing: Consistent gaps (gap-3, gap-6, gap-8) and container widths (max-w-6xl, max-w-7xl)
- Public cards, actions, media, and other rounded surfaces use a 4px radius. Keep fully rounded pills and circles only where their shape is intentional. Admin radius tokens remain independent.
- Images: aspect-[4/3] with overlay effects
- Animations: brief 140–200ms transitions; honor reduced motion and avoid attention-pulling effects.

### Animations & Interactions
- **@react-spring/web v9.7.3**: Spring-physics based animations
- **Swiper v11.0.6**: Legacy/modal gallery usage only. Avoid adding Swiper to static public sections because it increases client JavaScript.

### Firebase Integration
- **firebase v12.0.0**: Client-side Firebase SDK
- **firebase-admin v13.4.0**: Server-side Firebase Admin SDK for API routes
- **Firestore**: Main database for portfolio and articles
- **Authentication**: Admin access only
- **Storage**: Images and PDF files
- **Future**: Firebase AI/OCR for PDF quote processing
- Check `src/lib/firestore.ts` for database schemas and utilities

## Key Features & Workflows

### 1. Portfolio Management
- **Display**: SSG-generated portfolio pages for SEO
- **Homepage ProjectShow**: **UPDATED** Shows 25+ individual projects (vs 6-8 categories)
- **Limit System**: Auto-shows "ดูผลงานทั้งหมด" button when >25 projects
- **Admin**: Client-side forms for adding/editing portfolio items
- **Future**: PDF quote upload → AI extraction → auto-populate portfolio form

### 2. Article/Blog System
- **Display**: ISR-generated article pages with optimal SEO
- **Admin**: Rich text editor for content management
- **SEO**: Auto-generate meta descriptions, structured data

### 3. Core Pages
- Homepage (SSG) - **UPDATED** with enhanced ProjectShow
- Portfolio showcase (SSG/ISR) - **NEW** Video support
- Contact page (SSG with client form)
- Articles/Blog (ISR)
- Admin dashboard (Client-side)

### 4. Video Feature (NEW - v1.2)
- **Display**: Video gallery in portfolio detail pages
- **Player**: Custom HTML5 video player with controls
- **Modal**: Fullscreen video playback with navigation
- **Types**: Before/After/During/Detail video categorization
- **Upload**: Cloudflare-ready upload system (Admin UI pending)
- **SEO**: Video schema support (future enhancement)

## Database Schema (Firestore)

### Collections Structure
```typescript
// Portfolio Items
interface PortfolioItem {
 id: string;
 title: string;
 description: string;
 images: string[];
 category: string;
 completedDate: Date;
 location?: string;
 features: string[];
 seoTitle: string;
 seoDescription: string;
 slug: string;
}

// Articles
interface Article {
 id: string;
 title: string;
 content: string;
 excerpt: string;
 featuredImage: string;
 author: string;
 publishedDate: Date;
 category: string;
 tags: string[];
 seoTitle: string;
 seoDescription: string;
 slug: string;
 isPublished: boolean;
}
```

## Testing Strategy (TDD)

### Test-Driven Development Workflow
1. **Write tests first** - Always create test cases before implementation
2. **Run tests** - Confirm they fail initially
3. **Implement code** - Write minimal code to pass tests
4. **Refactor** - Improve code while keeping tests green
5. **Integration tests** - Test Firebase integration with emulators

### Test Categories
- **Unit Tests**: Components, utilities, Firebase functions
- **Integration Tests**: API routes, database operations
- **E2E Tests**: Critical user journeys (portfolio viewing, admin workflows)

## Git & Automation

### Auto-commit Workflow
- Use conventional commit messages: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`
- **IMPORTANT**: Always run type-check before committing
- Auto-format code on commit
- Run tests before push

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- Feature branches: `feature/portfolio-ai-extraction`
- Hotfix branches: `hotfix/seo-meta-tags`

## Important Files & Patterns

### Key Files to Understand
- `src/lib/firestore.ts` - Database utilities and schemas **UPDATED with ProjectVideo**
- `src/lib/firestore-admin.ts` - Server-side Firebase Admin SDK
- `src/lib/project-utils.ts` - **NEW** Data transformation for ProjectShow
- `src/lib/project-video-utils.ts` - **NEW v1.2** Video utility functions
- `src/lib/cloudflare/uploadVideo.ts` - **NEW v1.2** Video upload system
- `src/lib/seo.ts` - SEO helpers and meta tag generation
- `src/components/ui/VideoPlayer.tsx` - **NEW v1.2** Custom video player
- `src/components/ui/VideoModal.tsx` - **NEW v1.2** Fullscreen video modal
- `src/components/ui/` - Reusable UI components
- `src/app/projects/[slug]/page.tsx` - Project detail page (SSG/ISR example)
- `src/app/admin/` - Admin dashboard (client-side)

### Firebase Configuration
- Use Firebase emulators for development
- Environment variables in `.env.local`
- Security rules defined in `firestore.rules`

## SEO Best Practices

### SEO Change Rules (Required)

- **New, renamed, removed or republished public pages:** update `docs/seo-system/site-page-plan.md` (URL, implementation/publication status, sitemap eligibility). Review `src/app/sitemap.ts` and its data sources; ensure eligible pages appear automatically or update generation when needed. Never add planned pages, drafts, redirects, errors, noindex pages or non-canonical aliases to the sitemap. Record exclusions and pending production verification.
- **URL changes and removals:** do not add redirects to compensate for URLs that are renamed or removed. A retired URL returns 404 and has no alias, rewrite, meta refresh, or client-side navigation. Add a redirect only when the user explicitly authorizes that redirect in the current task and identifies the intended old URL and equivalent destination. Unknown URLs always return 404; never send them to the homepage or a parent page. Update canonical, internal links, breadcrumbs, structured-data URLs and sitemap together. Do not rename published URLs solely to insert keywords.
- **Publication checks:** verify real content, HTTP status, initial HTML, title/description, H1, canonical, robots/noindex, relevant structured data and incoming internal links. Sitemap `lastmod` must reflect a real significant content change; omit it when unknown. HTTP 200 alone is insufficient, including streamed not-found responses.

Choose the audit level by **blast radius**, not just file or URL count:

| Level | Trigger | Required SEO verification |
|---|---|---|
| Focused | 1–5 pages using unchanged templates/helpers | Check each changed page, its incoming links, sitemap inclusion/exclusion and any redirect pair against the publication checks above. Use relevant topics from `technical-seo-audit`; no full-site audit. |
| Template | Shared templates, URL/metadata helpers, navigation, or a larger batch of pages | Focused checks plus representative pages of every affected type, edge cases and unchanged control pages; inspect the generated sitemap for duplicates/conflicts. Run `yarn seo:qa` against the running local server (or `node scripts/seo-qa.mjs --base=http://127.0.0.1:3000`); add manual checks for URLs the script does not cover. |
| Site-wide | Bulk URL migration, global canonical/robots/indexing policy, or sitemap-generation changes | Use `technical-seo-audit` across all seven topics; reconcile the affected URL inventory with sitemap, redirects and indexability. Verify a local production build and document rollback for migration/indexing changes. Confirm deployed behavior when production access is in scope. |

- **Skill routing:** use `media-seo` for image/video discovery, markup or delivery changes; `core-web-vitals-audit` for performance investigations or changes likely to affect LCP/INP/CLS. Scope checks to affected pages/dependencies; a cosmetic edit alone does not trigger SEO audits. Skill audits remain inspection/reporting; implement only within the user's requested scope.
- **Completion evidence:** report the audit level, tested URLs/environment, commands/results, findings and unavailable checks. Keep local and production results separate; missing CMS/GSC/browser data is a limitation, not a pass or proof of Google indexing. These rules do not authorize deployment, external configuration changes or sitemap submission.

### Meta Tags & Structured Data
- Always include title, description, Open Graph tags
- Implement JSON-LD structured data for business and articles
- Use proper heading hierarchy (H1 → H2 → H3)
- Optimize images with alt text and proper sizing

### Performance
- Use Next.js Image component for optimization
- Implement lazy loading for portfolio items
- Minimize bundle size - avoid unnecessary client-side code
- Use ISR for frequently updated content (articles)

## Future Roadmap

### AI-Powered Quote Processing
- PDF upload functionality
- Firebase AI or OCR integration
- Auto-populate portfolio forms from quote data
- Validation and manual override capabilities

## Development Workflow

### Starting New Features
1. Create feature branch
2. Write tests for expected functionality
3. Implement with SSG/ISR for public features
4. Test with Firebase emulators
5. Type-check and lint
6. Create PR with proper description

### Debugging
- Use Firebase emulator suite for local testing
- Check browser Network tab for SSG/ISR behavior
- Verify SEO with browser dev tools
- Test mobile responsiveness

## Common Patterns

### SSG Page Example
```typescript
// For static portfolio pages
export async function generateStaticParams() {
 // Generate static paths
}

export async function generateMetadata({ params }): Promise<Metadata> {
 // Generate SEO metadata
}

export default async function PortfolioPage({ params }) {
 // Server component - no 'use client'
}
```

### Admin Page Example
```typescript
'use client'; // Only for admin pages

export default function AdminPortfolio() {
 // Client-side admin functionality
}
```

## IMPORTANT REMINDERS
- **SEO FIRST**: Public pages must be SSG/ISR - never client-side
- **Type Safety**: Always use proper TypeScript types
- **Testing**: Write tests before implementation (TDD)
- **Firebase**: Use emulators for development
- **Performance**: Optimize for Core Web Vitals
- **Auto-commit**: Always type-check before committing changes
