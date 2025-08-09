# API Documentation for Canvas Tent Website

Last updated: Sun Aug  3 17:29:44 +07 2025

## Current Dependencies Documentation
- [Next.js 15.0.1 Routing](./nextjs-15-routing.md)
- [Next.js 15.0.1 Data Fetching](./nextjs-15-data-fetching.md) 
- [Firebase v12 Firestore](./firebase-v12-firestore.md)
- [MUI v5.15.12 Overview](./mui-v5-overview.md)
- [MUI v5.15.12 Components](./mui-v5-components.md)
- [React Spring v9.7](./react-spring-v9.md)
- [Swiper v11](./swiper-v11.md)

## Implementation Examples
- [MUI + Next.js Setup](../examples/mui-nextjs-setup.tsx)
- [Portfolio Gallery with Swiper](../examples/portfolio-gallery.tsx)
- [Firebase v12 Setup](../examples/firebase-v12-setup.ts)
- [Portfolio Animations](../examples/portfolio-animations.tsx)

## Usage with Claude Code
Tell Claude to check these files for implementation patterns:
```
Check docs/apis/firebase-v12-firestore.md for v12 query examples
Look at docs/examples/portfolio-gallery.tsx for Swiper v11 implementation
Check docs/apis/mui-v5-components.md for MUI v5.15 patterns
```

## Key Integration Patterns
1. **MUI + Next.js 15**: Use AppRouterCacheProvider with Emotion
2. **Firebase v12**: New modular imports and query syntax
3. **Swiper v11**: Updated modules import system
4. **React Spring v9.7**: useInView hook for scroll animations
5. **SEO Focus**: Always SSG/ISR for public pages
