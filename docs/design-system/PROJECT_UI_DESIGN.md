# Project UI Design System

> **Design Pattern Documentation for Project-Related Components**
>
> This document captures the existing design patterns used across all project-related UI components. Use this as reference when creating new features or modifying existing UI to maintain visual consistency.

---

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Component Patterns](#component-patterns)
5. [Animations & Transitions](#animations--transitions)
6. [Responsive Breakpoints](#responsive-breakpoints)
7. [Code Examples](#code-examples)

---

## Color Palette

### Primary Colors
```css
/* Blue Shades - Primary Brand */
--primary-light: #027DFF
--primary-base: #008AD7
--primary-dark: #004589
--blue-600: #2563eb (Tailwind)
--blue-700: #1d4ed8 (Tailwind)
```

### Neutral Colors
```css
/* Text Colors */
--text-primary: #111827 (gray-900)
--text-secondary: #1f2937 (gray-800)
--text-tertiary: #374151 (gray-700)
--text-muted: #4b5563 (gray-600)
--text-disabled: #9ca3af (gray-400)

/* Background Colors */
--bg-white: #ffffff
--bg-gray-50: #f9fafb
--bg-gray-100: #f3f4f6
--bg-gray-200: #e5e7eb
```

### Semantic Colors
```css
/* Success */
--success-bg: #dbeafe (blue-100)
--success-text: #1e3a8a (blue-800)

/* Overlay */
--overlay-dark: rgba(0, 0, 0, 0.7)
--overlay-light: rgba(0, 0, 0, 0.2)
```

### Gradients
```css
/* Header Gradients */
background: linear-gradient(to right, #008AD7, #004589)

/* Subtle Background Gradients */
background: linear-gradient(to bottom right, #f9fafb, #ffffff, #dbeafe)

/* Section Gradients */
background: linear-gradient(to bottom, #111827, #1f2937, #111827)
```

---

## Typography

### Font Family
```typescript
// MUI Theme (src/theme.ts)
fontFamily: '"Sukhumvit Set", Arial, sans-serif'

// Headings
h1-h5: '"Sukhumvit Bold"'
h6: '"Sukhumvit Set"' with bold weight
```

### Font Sizes & Weights

#### Desktop
```css
/* Headings */
h1: text-4xl (36px) - font-bold
h2: text-3xl (30px) - font-bold
h3: text-2xl (24px) - font-semibold
h4: text-xl (20px) - font-semibold

/* Body Text */
text-lg: 18px - font-medium
text-base: 16px - font-normal/medium
text-sm: 14px - font-normal/medium
text-xs: 12px - font-medium
```

#### Mobile
```css
h1: text-lg (18px) - font-bold
h2: text-base (16px) - font-bold
text-sm: 14px
text-xs: 12px
```

### Line Heights
```css
leading-tight: 1.25
leading-relaxed: 1.625
leading-normal: 1.5
```

---

## Spacing & Layout

### Container Widths
```tsx
// Page Container
className="max-w-6xl mx-auto"  // Homepage ProjectShow
className="max-w-7xl mx-auto"  // Portfolio pages, Detail pages

// Content Padding
className="px-4 sm:px-6 lg:px-8"  // Standard horizontal padding
className="py-8" sm:py-12" lg:py-16"  // Standard vertical padding
```

### Grid Systems
```tsx
// Portfolio Grid (4-column responsive)
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"

// ProjectShow Desktop (2-column)
className="grid grid-cols-1 lg:grid-cols-2 gap-8"

// Thumbnail Grid (4-column)
className="grid grid-cols-4 gap-3"
```

### Spacing Scale
```css
gap-2: 0.5rem (8px)   - Tight spacing
gap-3: 0.75rem (12px) - Small spacing
gap-4: 1rem (16px)    - Default spacing
gap-6: 1.5rem (24px)  - Medium spacing
gap-8: 2rem (32px)    - Large spacing
gap-12: 3rem (48px)   - XL spacing
```

---

## Component Patterns

### 1. Project Cards

#### Design Specs
```tsx
// Card Container
className="bg-white rounded-2xl overflow-hidden shadow-sm
  hover:shadow-2xl transition-all duration-500
  transform hover:-translate-y-2"

// Image Container
className="relative aspect-[4/3] overflow-hidden bg-gray-100"

// Image Overlay Badge (Top Right - Image Count)
className="absolute top-3 right-3"
  <div className="bg-white/95 backdrop-blur-sm px-2 py-1
    rounded-lg text-xs font-medium text-gray-800 shadow-sm">
    {count} รูป
  </div>

// Category Badge (Top Left)
className="absolute top-3 left-3"
  <div className="bg-black/70 backdrop-blur-sm px-2 py-1
    rounded-lg text-xs font-medium text-white">
    {category}
  </div>

// Hover Overlay
className="absolute inset-0 bg-black/20
  transition-opacity duration-300
  ${isHovered ? 'opacity-100' : 'opacity-0'}"
```

#### Content Structure
```tsx
<div className="p-4 space-y-3">
  {/* Location & Year */}
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600">{location}</span>
    <span className="text-gray-500">{year}</span>
  </div>

  {/* Title */}
  <h3 className="font-semibold text-gray-900 text-lg
    leading-tight line-clamp-2
    group-hover:text-blue-600 transition-colors">
    {title}
  </h3>

  {/* Description */}
  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
    {description}
  </p>

  {/* Type Badge & CTA */}
  <div className="flex items-center justify-between">
    <div className="inline-flex items-center px-2.5 py-1
      rounded-full text-xs font-medium
      bg-blue-100 text-blue-800">
      {type}
    </div>
    <div className="text-blue-600 text-sm font-medium
      opacity-0 group-hover:opacity-100
      transition-all duration-200
      transform translate-x-2 group-hover:translate-x-0">
      ดูรายละเอียด →
    </div>
  </div>
</div>
```

### 2. Filter Chips

#### Desktop Chips
```tsx
<button className={`
  group relative inline-flex items-center
  px-6 py-3 rounded-full font-medium text-sm
  transition-all duration-300 transform hover:scale-105
  ${isActive
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-600/20'
    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300'
  }
`}>
  <span className="relative z-10 font-medium">
    {label}
  </span>

  {/* Count badge */}
  <span className={`
    ml-3 inline-flex items-center justify-center
    min-w-[24px] h-6 px-2 text-xs font-bold rounded-full
    ${isActive
      ? 'bg-white/20 text-white'
      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100'
    }
  `}>
    {count}
  </span>

  {/* Active glow effect */}
  {isActive && (
    <div className="absolute inset-0 rounded-full
      bg-gradient-to-r from-blue-600 to-blue-700
      opacity-90 animate-pulse"
      style={{ animationDuration: '2s' }} />
  )}
</button>
```

#### Mobile Chips (Horizontal Scroll)
```tsx
<div className="overflow-x-auto scrollbar-hide pb-2">
  <div className="flex gap-3 px-4 min-w-max">
    <button className={`
      group relative inline-flex items-center
      px-4 py-2.5 rounded-full font-medium text-sm
      whitespace-nowrap
      ${isActive
        ? 'bg-blue-600 text-white shadow-lg'
        : 'bg-white text-gray-700 border border-gray-200'
      }
    `}>
      {/* Same structure as desktop, smaller sizes */}
    </button>
  </div>
</div>
```

### 3. Section Headers

#### Desktop
```tsx
<div className="space-y-3 mb-8">
  {/* Main Title with Border Accent */}
  <div className="flex items-center">
    <h2 className="text-left font-bold text-3xl lg:text-4xl
      border-l-4 border-[#008AD7] pl-4 mr-2 text-gray-900">
      {mainTitle}
    </h2>
    <h2 className="text-3xl lg:text-4xl font-bold text-[#008AD7]">
      {accentTitle}
    </h2>
  </div>

  {/* Subtitle */}
  <p className="text-lg text-gray-700 font-medium ml-6 opacity-90">
    {subtitle}
  </p>
</div>
```

#### Mobile (Gradient Background)
```tsx
<div className="bg-gradient-to-r from-[#008AD7] to-[#004589] p-4">
  <div className="space-y-2">
    <div className="flex items-center justify-center">
      <h2 className="text-white font-bold text-lg">
        {title}
      </h2>
    </div>
    <p className="text-white text-sm text-center font-medium">
      {subtitle}
    </p>
  </div>
</div>
```

### 4. Image Galleries

#### Main Image
```tsx
<div className="relative group cursor-pointer rounded-xl overflow-hidden"
  style={{ aspectRatio: '4/3' }}>
  <Image
    fill
    className="object-cover
      transition-all duration-300
      group-hover:scale-[1.02] group-hover:shadow-xl"
    src={imageSrc}
    alt={altText}
  />
</div>
```

#### Thumbnail Grid
```tsx
<div className="grid grid-cols-4 gap-3">
  {images.map((img) => (
    <div key={img.id}
      className="relative group cursor-pointer">
      <Image
        width={140}
        height={105}
        className="w-full h-20 lg:h-24 object-cover rounded-lg
          transition-all duration-200
          group-hover:scale-105 group-hover:shadow-md"
        src={img.smallSize}
      />
      <div className="absolute inset-0
        bg-black/0 group-hover:bg-black/10
        rounded-lg transition-all duration-200" />
    </div>
  ))}
</div>
```

### 5. Detail Sections

#### Info Card (Key-Value Pairs)
```tsx
<div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    รายละเอียดโปรเจค
  </h2>

  <div className="divide-y divide-gray-200">
    <div className="flex justify-between items-center py-3">
      <span className="text-sm text-gray-500">ประเภทงาน</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
    {/* Repeat for each field */}
  </div>
</div>
```

#### Description Blocks (Mobile)
```tsx
<div className="space-y-3">
  {descriptions.map((desc) => {
    const [label, content] = desc.split(' : ');
    return (
      <div key={desc}
        className="p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="text-xs font-semibold text-[#027DFF]
          uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className="text-sm text-gray-800 font-medium">
          {content}
        </div>
      </div>
    );
  })}
</div>
```

### 6. Breadcrumbs

```tsx
// Standard implementation from Breadcrumbs component
<div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <Breadcrumbs items={[...]} />
  </div>
</div>
```

### 7. Call-to-Action Sections

#### CTA Buttons
```tsx
{/* Primary Button */}
<Button
  variant="contained"
  size="large"
  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700
    hover:from-blue-700 hover:to-blue-800
    text-white font-semibold rounded-xl shadow-lg
    transform hover:scale-105 transition-all duration-200"
>
  ขอใบเสนอราคา
</Button>

{/* Secondary Button */}
<Button
  variant="outlined"
  size="large"
  className="flex-1 border-2 border-gray-400
    hover:border-white text-gray-200 hover:text-white
    hover:bg-white/10 font-semibold rounded-xl
    transition-all duration-200"
>
  โทรปรึกษาทันที
</Button>
```

#### Full Section Example
```tsx
<section className="relative py-16 sm:py-20 lg:py-24
  bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
  text-white overflow-hidden">
  {/* Background Pattern */}
  <div className="absolute inset-0 opacity-5">
    <div className='absolute inset-0 bg-[url(`data:image/svg+xml...`)]' />
  </div>

  <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center space-y-8 sm:space-y-12">
      {/* Headline */}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
        <span className="block mb-2">Main text</span>
        <span className="block text-blue-400">Accent text</span>
      </h2>

      {/* Divider */}
      <div className="flex justify-center">
        <div className="w-16 sm:w-24 h-1
          bg-gradient-to-r from-blue-400 to-green-400 rounded-full" />
      </div>

      {/* Buttons & Info */}
      {/* ... */}
    </div>
  </div>
</section>
```

---

## Animations & Transitions

### Hover Effects
```css
/* Cards */
transition-all duration-500
transform hover:-translate-y-2
shadow-sm hover:shadow-2xl

/* Images */
transition-all duration-300 group-hover:scale-110

/* Buttons/Chips */
transition-all duration-300 transform hover:scale-105

/* Text */
transition-colors duration-200
```

### Fade-in Animations
```tsx
// Chip fade-in with stagger
<style jsx>{`
  @keyframes chip-fade-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .chip-filter {
    animation: chip-fade-in 0.4s ease-out var(--delay, 0ms) both;
  }
`}</style>

// Usage with delay
style={{ animationDelay: `${index * 50}ms` }}
```

### Loading States
```tsx
{/* Image skeleton */}
{!imageLoaded && (
  <div className="absolute inset-0
    bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
    animate-pulse" />
)}

{/* Spinner */}
<div className="w-8 h-8 border-2 border-white/20 border-t-white
  rounded-full animate-spin"></div>
```

### Active State Pulses
```tsx
{isActive && (
  <div className="absolute inset-0 rounded-full
    bg-gradient-to-r from-blue-600 to-blue-700
    opacity-90 animate-pulse"
    style={{ animationDuration: '2s' }} />
)}
```

---

## Responsive Breakpoints

### Tailwind Breakpoints
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Large screens */
2xl: 1536px /* Extra large screens */
```

### Common Patterns
```tsx
// Hide/Show by breakpoint
className="hidden md:flex"  /* Hide on mobile, show on tablet+ */
className="flex md:hidden"  /* Show on mobile, hide on tablet+ */

// Text sizes
className="text-sm sm:text-base lg:text-lg"

// Spacing
className="py-8 sm:py-12 lg:py-16"
className="px-4 sm:px-6 lg:px-8"

// Grid columns
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
```

---

## Code Examples

### Complete ProjectShow Card (Desktop)
```tsx
<div className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
    {/* Image Section */}
    <div className="space-y-4">
      <div className="relative group">
        <Image
          width={600}
          height={450}
          className="w-full h-auto aspect-[4/3] object-cover rounded-xl
            cursor-pointer transition-all duration-300
            group-hover:scale-[1.02] group-hover:shadow-xl"
          src={mainImage}
          alt={title}
        />
        <div className="absolute top-3 right-3">
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5
            rounded-lg text-sm font-medium text-gray-800 shadow-sm">
            {imageCount} รูป
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {thumbnails.map((thumb) => (
          <div key={thumb.id} className="relative group cursor-pointer">
            <Image
              width={140}
              height={105}
              className="w-full h-20 lg:h-24 object-cover rounded-lg
                transition-all duration-200
                group-hover:scale-105 group-hover:shadow-md"
              src={thumb.url}
            />
            <div className="absolute inset-0 bg-black/0
              group-hover:bg-black/10 rounded-lg transition-all duration-200" />
          </div>
        ))}
      </div>
    </div>

    {/* Details Section */}
    <div className="space-y-6">
      <div className="space-y-4">
        {details.map((item) => {
          const [label, content] = item.split(' : ');
          return (
            <div key={item}
              className="flex flex-col space-y-1.5 p-4 bg-gray-50 rounded-xl">
              <span className="text-sm font-semibold text-[#027DFF]
                uppercase tracking-wide">
                {label}
              </span>
              <span className="text-base text-gray-800 font-medium">
                {content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
</div>
```

### Complete Portfolio Card
```tsx
<Link href={`/portfolio/${slug}`} className="group block">
  <article className="bg-white rounded-2xl overflow-hidden
    shadow-sm hover:shadow-2xl transition-all duration-500
    transform hover:-translate-y-2">

    {/* Image Container */}
    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
      <Image
        src={featuredImage}
        alt={title}
        fill
        className="object-cover transition-all duration-700
          group-hover:scale-110"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Badges */}
      <div className="absolute top-3 right-3">
        <div className="bg-white/95 backdrop-blur-sm px-2 py-1
          rounded-lg text-xs font-medium text-gray-800 shadow-sm">
          {imageCount} รูป
        </div>
      </div>

      <div className="absolute top-3 left-3">
        <div className="bg-black/70 backdrop-blur-sm px-2 py-1
          rounded-lg text-xs font-medium text-white">
          {category}
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <svg className="w-4 h-4" {...locationIcon} />
          <span className="truncate">{location}</span>
        </div>
        <div className="text-gray-500 font-medium">{year}</div>
      </div>

      <h3 className="font-semibold text-gray-900 text-lg
        leading-tight line-clamp-2
        group-hover:text-blue-600 transition-colors duration-200">
        {title}
      </h3>

      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <div className="inline-flex items-center px-2.5 py-1
          rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {type}
        </div>

        <div className="text-blue-600 text-sm font-medium
          opacity-0 group-hover:opacity-100
          transition-all duration-200
          transform translate-x-2 group-hover:translate-x-0">
          ดูรายละเอียด →
        </div>
      </div>
    </div>
  </article>
</Link>
```

---

## 🆕 Component 8: Before/After Image Comparison

**Interactive slider to showcase project transformations (ก่อน-หลังติดตั้ง)**

### BeforeAfterSlider Component

**Location**: `src/app/components/ui/BeforeAfterSlider.tsx`

**Usage**:
```tsx
<BeforeAfterSlider
  beforeImage="/path/to/before.jpg"
  afterImage="/path/to/after.jpg"
  beforeAlt="ก่อนติดตั้ง"
  afterAlt="หลังติดตั้ง"
  initialPosition={50}
/>
```

**Features**:
- 🖱️ Mouse drag (desktop) + 👆 Touch drag (mobile)
- ⌨️ Keyboard: Arrow keys ±5%, Home/End for 0%/100%
- ⚡ RAF-optimized (< 16ms, Doherty Threshold)
- 📱 Touch targets: 48px (mobile), 40px (desktop) - Fitts's Law
- 🎨 Color-coded badges: 🔴 ก่อน (red-500), 🟢 หลัง (green-500)

**Design Tokens**:
```css
/* Divider */
width: 4px;
background: linear-gradient(#60a5fa, #3b82f6, #2563eb);

/* Handle */
size: 48px (mobile), 40px (desktop);
background: white;
border: 3px solid blue-500;
box-shadow: 0 4px 12px rgba(0,0,0,0.3);
hover: scale(1.1);
```

### BeforeAfterGallery Component

**Location**: `src/app/components/portfolio/BeforeAfterGallery.tsx`

**Usage**:
```tsx
<BeforeAfterGallery
  project={project}
  beforeImage={getBeforeImage(project)}
  afterImages={getAfterImages(project)}
/>
```

**Features**:
- Main Before/After slider
- Thumbnail gallery (max 8 - Miller's Law)
- Click thumbnail → switch after image
- Image counter: "รูปที่ X / Y"

### Utility Functions

**Location**: `src/lib/project-image-utils.ts`

```typescript
// Get before image (fallback: first image)
getBeforeImage(project) → string

// Get after images (backward compatible)
getAfterImages(project) → ProjectImage[]

// Check if should show Before/After
shouldShowBeforeAfter(project) → boolean

// Get badge info
getImageTypeBadge(type) → { color, label, emoji }
```

### Usage in Components

**ProjectShow (Homepage)**:
```tsx
{shouldShowBeforeAfter ? (
  <BeforeAfterSlider before={...} after={...} />
) : (
  <Image src={...} /> // Fallback
)}
```

**PortfolioCard (Hover)**:
```tsx
<Image src={after} className={hover ? 'opacity-0' : 'opacity-100'} />
<Image src={before} className={hover ? 'opacity-100' : 'opacity-0'} />
<Badge>{hover ? '🔴 ก่อน' : '🟢 หลัง'}</Badge>
```

**PortfolioDetailClient (Detail)**:
```tsx
{shouldShowBeforeAfter(project) ? (
  <BeforeAfterGallery ... />
) : (
  <RegularGallery ... />
)}
```

### Admin: Image Type Management

**ProjectForm.tsx**:
- Dropdown selector per image
- Visual badges: 🔴 before, 🟢 after, 🟡 during, 🔵 detail
- Real-time Firestore updates
- Warning if no before image

### Laws of UX Applied

- **Fitts's Law**: Large touch targets (48px mobile)
- **Doherty Threshold**: < 16ms response (RAF)
- **Jakob's Law**: Familiar vertical divider pattern
- **Miller's Law**: Max 8 thumbnails visible
- **Von Restorff Effect**: Color-coded badges stand out
- **Aesthetic-Usability**: Smooth animations, professional look

---

## Best Practices

### When Creating New Components

1. **Colors**: Stick to defined palette. Use `blue-600` for primary actions, `gray-900` for headings
2. **Spacing**: Use consistent gaps (`gap-3`, `gap-6`, `gap-8`)
3. **Cards**: Always use `rounded-2xl`, `shadow-sm → shadow-2xl` on hover
4. **Images**: Maintain `aspect-[4/3]` ratio, add overlay effects on hover
5. **Typography**: Use hierarchy - bold for headings, medium for labels, normal for body
6. **Transitions**: Keep duration consistent - `duration-200` for fast, `duration-500` for dramatic
7. **Mobile-First**: Start with mobile classes, add `sm:`, `lg:` for larger screens
8. **Accessibility**: Include proper alt text, aria-labels, keyboard navigation

### When Modifying Existing UI

1. **Check this document first** - Understand existing patterns
2. **Maintain consistency** - Don't introduce new colors/spacings without reason
3. **Test responsiveness** - Check mobile, tablet, desktop breakpoints
4. **Preserve animations** - Keep transition durations and effects
5. **Update this doc** - If you add new patterns, document them here

---

## Component Locations

```
src/app/components/section/ProjectShow.tsx       - Homepage featured project cards
src/app/components/portfolio/PortfolioCard.tsx   - Reusable portfolio card
src/app/components/portfolio/StaticPortfolioGrid.tsx - Portfolio grid layout
src/app/components/portfolio/PortfolioWithFilters.tsx - Filter chips & grid
src/app/portfolio/[slug]/PortfolioDetailClient.tsx - Project detail page
src/app/portfolio/page.tsx - Portfolio listing page
src/app/components/ui/BeforeAfterSlider.tsx - 🆕 Before/After slider component
src/app/components/portfolio/BeforeAfterGallery.tsx - 🆕 Gallery with Before/After
src/lib/project-image-utils.ts - 🆕 Image utility functions
src/theme.ts - MUI theme configuration
```

---

**Last Updated**: 2025-10-03
**Maintained By**: Development Team
**Version**: 1.1 (Added Before/After Feature)
