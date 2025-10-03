# Canvas Tent Sales Website - CLAUDE.md

## Project Overview
A modern canvas tent sales website focusing on showcasing company portfolio and SEO-optimized articles. Built with TypeScript + Next.js 15 (App Router) + Firebase + Yarn in a monorepo structure.

**CRITICAL: This is an SEO-focused website. NEVER use 'use client' or client-side rendering except for admin pages. Always prioritize SSG/ISR for public pages.**

## Tech Stack & Commands

### Dependencies (Current Versions)
```json
{
 "@emotion/cache": "^11.11.0",
 "@emotion/react": "^11.11.4",
 "@emotion/styled": "^11.11.0",
 "@mui/icons-material": "^5.15.12",
 "@mui/material": "^5.15.12",
 "@mui/material-nextjs": "^5.15.11",
 "@next/third-parties": "^15.0.1",
 "@react-spring/web": "^9.7.3",
 "@fortawesome/react-fontawesome": "^0.2.0",
 "firebase": "^12.0.0",
 "firebase-admin": "^13.4.0",
 "next": "^15.0.1",
 "react": "^18",
 "react-dom": "^18",
 "swiper": "^11.0.6",
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
├── apps/
│   └── web/                 # Main Next.js application
├── packages/
│   ├── ui/                  # Shared UI components (MUI/Tailwind)
│   ├── firebase-config/     # Firebase configuration
│   └── types/               # Shared TypeScript types
├── functions/               # Firebase Cloud Functions
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
- **MUI v5.15.12**: Primary component library with Emotion styling
- **@mui/material-nextjs**: Next.js optimized MUI integration
- **@emotion/react & @emotion/styled**: CSS-in-JS styling solution
- **@mui/icons-material**: Material Design icons
- **@fortawesome/react-fontawesome**: FontAwesome icons for additional icons

### Design System
**IMPORTANT: Before making UI changes to project-related components, ALWAYS consult:**
- [`/docs/design-system/PROJECT_UI_DESIGN.md`](/docs/design-system/PROJECT_UI_DESIGN.md) - Comprehensive design patterns and component library

This design system ensures consistency across:
- **ProjectShow** (Homepage featured projects)
- **Portfolio Grid & Cards** (Portfolio listing pages)
- **Portfolio Detail Pages** (Individual project pages)
- **Filter Chips** (Category filtering)
- **Navigation Components** (Breadcrumbs, CTAs)

**Key Design Principles:**
- Color palette: Primary blues (#008AD7, #027DFF, blue-600), neutral grays
- Typography: Sukhumvit Set font family with bold headings
- Spacing: Consistent gaps (gap-3, gap-6, gap-8) and container widths (max-w-6xl, max-w-7xl)
- Cards: rounded-2xl with shadow-sm → shadow-2xl on hover
- Images: aspect-[4/3] with overlay effects
- Animations: duration-300 for quick, duration-500 for dramatic transitions

### Animations & Interactions
- **@react-spring/web v9.7.3**: Spring-physics based animations
- **Swiper v11.0.6**: Touch slider component for portfolio galleries

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
- Portfolio showcase (SSG/ISR)
- Contact page (SSG with client form)
- Articles/Blog (ISR)
- Admin dashboard (Client-side)

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
- `src/lib/firestore.ts` - Database utilities and schemas
- `src/lib/firestore-admin.ts` - Server-side Firebase Admin SDK
- `src/lib/project-utils.ts` - **NEW** Data transformation for ProjectShow
- `src/lib/seo.ts` - SEO helpers and meta tag generation
- `src/components/ui/` - Reusable UI components
- `src/app/portfolio/[slug]/page.tsx` - Portfolio detail page (SSG example)
- `src/app/admin/` - Admin dashboard (client-side)

### Firebase Configuration
- Use Firebase emulators for development
- Environment variables in `.env.local`
- Security rules defined in `firestore.rules`

## SEO Best Practices

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
