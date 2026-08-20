# UI Stack

This project uses Tailwind utility classes, shadcn-style component structure, Base UI primitives, lucide-react icons, and some existing DaisyUI classes.

Do not introduce MUI or Emotion for new UI work. The current dependency set does not include `@mui/material`, `@mui/material-nextjs`, or Emotion packages.

## Project Conventions

- Public SEO pages should stay server-rendered by default.
- Add `'use client'` only for real browser state, event handling, browser APIs, or interactive widgets.
- Prefer `src/components/ui` for reusable shadcn-style primitives.
- Prefer `lucide-react` for icons.
- Use `next/image` for public images and provide useful `alt` text and `sizes`.
