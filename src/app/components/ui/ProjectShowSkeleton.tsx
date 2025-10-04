/**
 * ProjectShowSkeleton - Skeleton for ProjectShow component (Homepage)
 *
 * Features:
 * - Desktop and mobile versions
 * - Matches actual ProjectShow layout
 */

export default function ProjectShowSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden w-full lg:flex md:flex justify-center mb-10 px-4 animate-pulse">
        <div className="container max-w-6xl mx-auto">
          {/* Title Section */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-10 bg-gray-300 rounded w-64 border-l-4 border-gray-400" />
              <div className="h-10 bg-gray-200 rounded w-32" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-96 ml-6" />
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Section */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="w-full aspect-[4/3] bg-gray-200 rounded-xl" />

                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-20 lg:h-24 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 bg-gray-100 rounded-xl space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24" />
                    <div className="h-5 bg-gray-200 rounded w-48" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-gray-200" />
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="flex lg:hidden md:hidden flex-col bg-white rounded-2xl shadow-lg my-6 mx-4 overflow-hidden animate-pulse">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-4 space-y-2">
          <div className="h-6 bg-gray-100/50 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-gray-100/50 rounded w-1/2 mx-auto" />
        </div>

        <div className="p-4 space-y-4">
          {/* Main Image */}
          <div className="w-full h-64 bg-gray-200 rounded-xl" />

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>

          {/* Details */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-gray-100 rounded-xl space-y-2">
                <div className="h-3 bg-gray-300 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
