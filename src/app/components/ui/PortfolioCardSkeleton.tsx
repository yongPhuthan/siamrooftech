/**
 * PortfolioCardSkeleton - Skeleton loading state for portfolio cards
 *
 * Features:
 * - Matches actual portfolio card layout
 * - Smooth shimmer animation
 * - Responsive design
 */

export default function PortfolioCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-48 sm:h-56 lg:h-56 bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Tags */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-6 w-24 bg-gray-200 rounded-full" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-300 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>

        {/* Year */}
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards
 */
export function PortfolioGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PortfolioCardSkeleton key={i} />
      ))}
    </div>
  );
}
