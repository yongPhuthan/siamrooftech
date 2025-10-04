/**
 * Portfolio Detail loading.tsx - Skeleton for individual portfolio page
 */
export default function PortfolioDetailLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Breadcrumbs Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-16" />
                {i < 4 && <div className="h-4 w-4 bg-gray-100 rounded" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Title */}
        <div className="block lg:hidden mb-6">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-6 bg-gray-100 rounded w-1/2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery Skeleton */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="w-full aspect-[4/3] bg-gray-200 rounded-xl" />

            {/* Thumbnails */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Project Info Skeleton */}
          <div className="space-y-6">
            {/* Desktop Title */}
            <div className="hidden lg:block">
              <div className="flex gap-2 mb-4">
                <div className="h-8 bg-gray-200 rounded-full w-32" />
                <div className="h-8 bg-gray-200 rounded-full w-28" />
              </div>
              <div className="h-10 bg-gray-300 rounded w-full mb-2" />
              <div className="h-10 bg-gray-200 rounded w-3/4" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-full" />
              <div className="h-5 bg-gray-200 rounded w-5/6" />
              <div className="h-5 bg-gray-200 rounded w-4/6" />
            </div>

            {/* Details Box */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-300 rounded w-32" />
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4">
              <div className="h-12 bg-gray-300 rounded-lg flex-1" />
              <div className="h-12 bg-gray-200 rounded-lg flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Related Projects Skeleton */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-200">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-300 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
