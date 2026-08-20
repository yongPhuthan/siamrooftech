# API Documentation for Siamrooftech SEO Website

Last updated: Fri Jul 24 2026

## Current Dependencies Documentation
- [Next.js 15 Routing](./nextjs-15-routing.md)
- [Next.js 15 Data Fetching](./nextjs-15-data-fetching.md)
- [Firebase v12 Firestore](./firebase-v12-firestore.md)
- [Tailwind + shadcn-style UI Stack](./ui-stack.md)
- [React Spring v9.7](./react-spring-v9.md)
- [Swiper v11](./swiper-v11.md)

## Implementation Examples
- [Tailwind/shadcn-style Button Link](../examples/ui-button-link.tsx)
- [Portfolio Gallery with Swiper](../examples/portfolio-gallery.tsx)
- [Firebase v12 Setup](../examples/firebase-v12-setup.ts)
- [Portfolio Animations](../examples/portfolio-animations.tsx)

## Usage with Claude Code
Tell Claude to check these files for implementation patterns:
```
Check docs/apis/firebase-v12-firestore.md for v12 query examples
Look at docs/examples/portfolio-gallery.tsx for Swiper v11 implementation
Check docs/apis/ui-stack.md for Tailwind/shadcn-style UI patterns
```

## Key Integration Patterns
1. **Tailwind + shadcn-style components**: Use server components by default on public SEO pages
2. **Firebase v12**: New modular imports and query syntax
3. **Swiper v11**: Use only for interactive galleries/modals, not static public sections
4. **React Spring v9.7**: useInView hook for scroll animations
5. **SEO Focus**: Always SSG/ISR for public pages
