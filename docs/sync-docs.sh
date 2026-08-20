#!/bin/bash
# docs/sync-docs.sh - Sync external documentation for exact dependency versions

set -e

DOCS_DIR="./docs/apis"
EXAMPLES_DIR="./docs/examples"
mkdir -p "$DOCS_DIR" "$EXAMPLES_DIR"

echo "🔄 Syncing external documentation for current dependencies..."

# Next.js 15.0.1 documentation
echo "📦 Downloading Next.js 15 App Router docs..."
curl -s "https://raw.githubusercontent.com/vercel/next.js/v15.0.1/docs/02-app/01-building-your-application/01-routing/01-defining-routes.mdx" \
  -o "$DOCS_DIR/nextjs-15-routing.md" 2>/dev/null || echo "⚠️  Next.js routing doc not found, using latest"

curl -s "https://raw.githubusercontent.com/vercel/next.js/v15.0.1/docs/02-app/01-building-your-application/02-data-fetching/01-fetching-caching-and-revalidating.mdx" \
  -o "$DOCS_DIR/nextjs-15-data-fetching.md" 2>/dev/null || echo "⚠️  Next.js data fetching doc not found, using latest"

# Firebase v12 documentation  
echo "🔥 Downloading Firebase v12 docs..."
curl -s "https://raw.githubusercontent.com/firebase/firebase-js-sdk/v12.0.0/docs/firestore.md" \
  -o "$DOCS_DIR/firebase-v12-firestore.md" 2>/dev/null || echo "⚠️  Firebase v12 doc not found, using latest"

# UI stack notes
echo "🎨 Writing Tailwind + shadcn-style UI notes..."
cat > "$DOCS_DIR/ui-stack.md" << 'EOF'
# UI Stack

This project uses Tailwind utility classes, shadcn-style component structure, Base UI primitives, lucide-react icons, and some existing DaisyUI classes.

Do not introduce MUI or Emotion for new UI work. The current dependency set does not include `@mui/material`, `@mui/material-nextjs`, or Emotion packages.

## Project Conventions

- Public SEO pages should stay server-rendered by default.
- Add `'use client'` only for real browser state, event handling, browser APIs, or interactive widgets.
- Prefer `src/components/ui` for reusable shadcn-style primitives.
- Prefer `lucide-react` for icons.
- Use `next/image` for public images and provide useful `alt` text and `sizes`.
EOF

# React Spring v9.7 documentation
echo "🌸 Downloading React Spring v9.7 docs..."
curl -s "https://raw.githubusercontent.com/pmndrs/react-spring/v9.7.3/README.md" \
  -o "$DOCS_DIR/react-spring-v9.md" 2>/dev/null || echo "⚠️  React Spring v9.7 doc not found, using latest"

# Swiper v11 documentation
echo "📱 Downloading Swiper v11 docs..."
curl -s "https://raw.githubusercontent.com/nolimits4web/swiper/v11.0.6/README.md" \
  -o "$DOCS_DIR/swiper-v11.md" 2>/dev/null || echo "⚠️  Swiper v11 doc not found, using latest"

# Create common implementation examples
echo "📋 Creating implementation examples..."

# Tailwind + shadcn-style component example
cat > "$EXAMPLES_DIR/ui-button-link.tsx" << 'EOF'
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function ButtonLink({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
EOF

# Portfolio gallery with Swiper
cat > "$EXAMPLES_DIR/portfolio-gallery.tsx" << 'EOF'
// Example: Swiper v11 for an interactive modal/gallery only.
// Do not use Swiper for static public sections such as logo strips.
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface PortfolioGalleryProps {
  images: string[];
  title: string;
}

export default function PortfolioGallery({ images, title }: PortfolioGalleryProps) {
  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl bg-gray-100">
      <Swiper
        modules={[Navigation, Pagination, EffectFade]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        effect="fade"
        loop={true}
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="relative h-[400px] w-full">
              <Image
                src={image}
                alt={`${title} - รูปที่ ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
EOF

# Firebase v12 + Next.js example
cat > "$EXAMPLES_DIR/firebase-v12-setup.ts" << 'EOF'
// Example: Firebase v12 setup with Next.js 15
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Your config
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Example Firestore query with v12
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function getPortfolioItems() {
  const q = query(
    collection(db, 'portfolio'),
    where('isPublished', '==', true),
    orderBy('completedDate', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
EOF

# React Spring animation example
cat > "$EXAMPLES_DIR/portfolio-animations.tsx" << 'EOF'
// Example: Portfolio animations with React Spring v9.7
import { useSpring, animated, useInView } from '@react-spring/web';
import Image from 'next/image';

interface AnimatedPortfolioCardProps {
  title: string;
  description: string;
  image: string;
}

export default function AnimatedPortfolioCard({ 
  title, 
  description, 
  image 
}: AnimatedPortfolioCardProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const cardAnimation = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0px)' : 'translateY(50px)',
    config: { tension: 280, friction: 60 },
  });

  const imageAnimation = useSpring({
    transform: inView ? 'scale(1)' : 'scale(0.8)',
    config: { tension: 200, friction: 50 },
  });

  return (
    <animated.div ref={ref} style={cardAnimation}>
      <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-xl">
        <animated.div className="relative h-[300px] w-full" style={imageAnimation}>
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </animated.div>
        <div className="space-y-2 p-6">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{description}</p>
        </div>
      </article>
    </animated.div>
  );
}
EOF

# Create index file
echo "📋 Creating documentation index..."
cat > "$DOCS_DIR/README.md" << EOF
# API Documentation for Siamrooftech SEO Website

Last updated: $(date)

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
\`\`\`
Check docs/apis/firebase-v12-firestore.md for v12 query examples
Look at docs/examples/portfolio-gallery.tsx for Swiper v11 implementation
Check docs/apis/ui-stack.md for Tailwind/shadcn-style UI patterns
\`\`\`

## Key Integration Patterns
1. **Tailwind + shadcn-style components**: Use server components by default on public SEO pages
2. **Firebase v12**: New modular imports and query syntax
3. **Swiper v11**: Use only for interactive galleries/modals, not static public sections
4. **React Spring v9.7**: useInView hook for scroll animations
5. **SEO Focus**: Always SSG/ISR for public pages
EOF

echo "✅ Documentation sync complete!"
echo "📁 Files saved to: $DOCS_DIR"
echo "📂 Examples saved to: $EXAMPLES_DIR"
echo "💡 Run 'yarn docs:sync' to update documentation"
echo "🔍 Run 'yarn docs:serve' to serve docs locally"
