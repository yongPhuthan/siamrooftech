import Image from "next/image";
import Link from "next/link";
import { Project } from "../../../lib/firestore";

interface StaticPortfolioGridProps {
  projects: Project[];
}

export default function StaticPortfolioGrid({
  projects,
}: StaticPortfolioGridProps) {
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ยังไม่มีผลงานในหมวดนี้
          </h3>
          <p className="text-gray-600 mb-6">
            กรุณาติดตามผลงานใหม่ๆ ของเราในอนาคต
          </p>
          <Link
            href="/portfolio"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            ดูผลงานทั้งหมด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project, index) => (
          <Link
            key={project.id}
            href={`/portfolio/${decodeURIComponent(
              project.slug || project.id
            ).toLowerCase()}`}
            className="group block"
          >
            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Image
                  src={
                    project.featured_image ||
                    project.images?.[0]?.original_size ||
                    "/images/default-project.jpg"
                  }
                  alt={project.images[0].description ?? project.title }
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Image overlay with project count */}
                <div className="absolute top-3 right-3">
                  <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-800 shadow-sm">
                    {project.images?.length || 1} รูป
                  </div>
                </div>

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white">
                    {project.category}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Location and Type */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="truncate">{project.location}</span>
                  </div>
                  <div className="text-gray-500 font-medium">
                    {project.year}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                  กันสาดพับเก็บได้ {project.type} หน้ากว้าง {project.width} เมตร x ระยะแขนพับ {project.extension} เมตร
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {Array.isArray(project.description)
                    ? project.description[0] || ""
                    : project.description || ""}
                </p>

                {/* System Type */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {project.type}
                  </div>

                  {/* View Project Link */}
                  <div className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                    ดูรายละเอียด
                    <svg
                      className="w-4 h-4 inline ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Results summary */}
      <div className="text-center text-gray-500 text-sm">
        แสดงผลงาน {projects.length} โปรเจกต์
      </div>
    </div>
  );
}
