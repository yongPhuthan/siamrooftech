import { PortfolioGridSkeleton } from '../components/ui/PortfolioCardSkeleton';

/**
 * Portfolio loading.tsx - Skeleton for portfolio listing page
 */
export default function PortfolioLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-64" />
            <div className="h-6 bg-gray-100 rounded w-96" />
          </div>
        </div>
      </div>

      {/* Filter Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-3 overflow-x-auto pb-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Portfolio Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PortfolioGridSkeleton count={12} />
      </div>
    </div>
  );
}
