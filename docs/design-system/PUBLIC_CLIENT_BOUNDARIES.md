# Existing Public Client Boundaries

This inventory records public client boundaries that predate the theme migration. Keep each boundary limited to its current interaction or tracking purpose; visual changes alone do not justify a new client component. Admin code is outside this inventory.

`src/components/site/Navigation.tsx` owns the existing responsive menu and scroll state. The public LINE/contact area owns lead attribution and the fixed contact actions. Project and gallery features own filtering, media navigation, and before/after interaction. Portfolio CTA, attribution, and route loading components retain their existing browser event behavior. Unused legacy components remain recorded until their consumers are removed or the components are deleted.

The exact files currently carrying a `use client` directive are:

- `src/components/site/Navigation.tsx`
- `src/features/line-contact/LineLeadCapture.tsx`
- `src/features/line-contact/LineButtonsLayout.tsx`
- `src/features/line-contact/lead-intake.ts`
- `src/app/components/SiteFooter.tsx`
- `src/app/components/portfolio/PortfolioWithFilters.tsx`
- `src/app/components/AttributionCapture.tsx`
- `src/app/components/portfolio/SeparateBeforeAfterGallery.tsx`
- `src/app/components/section/PortfolioCTA.tsx`
- `src/app/components/section/ImageGalleryModal.tsx`
- `src/app/components/portfolio/PortfolioSearchFilters.tsx`
- `src/app/components/ui/BeforeAfterSlider.tsx`
- `src/app/components/ui/ContactForm.tsx` (no current consumers)
- `src/app/components/TrackedContactLink.tsx`
- `src/app/components/portfolio/PortfolioImageGallery.tsx` (no current consumers)
- `src/app/components/portfolio/PortfolioFilters.tsx`
- `src/app/components/providers/RouteLoadingProvider.tsx`
- `src/app/components/portfolio/PortfolioProvider.tsx`
- `src/app/components/portfolio/PortfolioCard.tsx`
- `src/app/components/portfolio/PortfolioGrid.tsx` (no current consumers)
- `src/app/components/portfolio/BeforeAfterGallery.tsx` (no current consumers)
- `src/app/components/projects/ProjectDetailClient.tsx`
