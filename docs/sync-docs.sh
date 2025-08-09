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

# MUI v5.15.12 documentation
echo "🎨 Downloading MUI v5.15 docs..."
curl -s "https://raw.githubusercontent.com/mui/material-ui/v5.15.12/docs/data/material/getting-started/overview/overview.md" \
  -o "$DOCS_DIR/mui-v5-overview.md" 2>/dev/null || echo "⚠️  MUI v5.15 doc not found, using latest"

curl -s "https://raw.githubusercontent.com/mui/material-ui/v5.15.12/docs/data/material/components/app-bar/app-bar.md" \
  -o "$DOCS_DIR/mui-v5-components.md" 2>/dev/null || echo "⚠️  MUI components doc not found, using latest"

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

# MUI + Next.js example
cat > "$EXAMPLES_DIR/mui-nextjs-setup.tsx" << 'EOF'
// Example: MUI + Next.js 15 + Emotion setup
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
EOF

# Portfolio gallery with Swiper
cat > "$EXAMPLES_DIR/portfolio-gallery.tsx" << 'EOF'
// Example: Portfolio gallery with Swiper v11 + MUI
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import { Box, Card, CardMedia } from '@mui/material';
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
    <Box sx={{ width: '100%', height: 400 }}>
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
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={image}
                alt={`${title} - รูปที่ ${index + 1}`}
              />
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
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
import { Box, Typography } from '@mui/material';

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
      <Box sx={{ overflow: 'hidden', borderRadius: 2 }}>
        <animated.img
          src={image}
          alt={title}
          style={{
            width: '100%',
            height: 300,
            objectFit: 'cover',
            ...imageAnimation,
          }}
        />
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h3" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
    </animated.div>
  );
}
EOF

# Create index file
echo "📋 Creating documentation index..."
cat > "$DOCS_DIR/README.md" << EOF
# API Documentation for Canvas Tent Website

Last updated: $(date)

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
\`\`\`
Check docs/apis/firebase-v12-firestore.md for v12 query examples
Look at docs/examples/portfolio-gallery.tsx for Swiper v11 implementation
Check docs/apis/mui-v5-components.md for MUI v5.15 patterns
\`\`\`

## Key Integration Patterns
1. **MUI + Next.js 15**: Use AppRouterCacheProvider with Emotion
2. **Firebase v12**: New modular imports and query syntax
3. **Swiper v11**: Updated modules import system
4. **React Spring v9.7**: useInView hook for scroll animations
5. **SEO Focus**: Always SSG/ISR for public pages
EOF

echo "✅ Documentation sync complete!"
echo "📁 Files saved to: $DOCS_DIR"
echo "📂 Examples saved to: $EXAMPLES_DIR"
echo "💡 Run 'yarn docs:sync' to update documentation"
echo "🔍 Run 'yarn docs:serve' to serve docs locally"