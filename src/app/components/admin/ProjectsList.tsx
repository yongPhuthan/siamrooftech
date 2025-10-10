"use client";

import { useState } from "react";
import { Project } from "../../../lib/firestore";
import { getAfterImages, getBeforeImages } from "../../../lib/project-image-utils";

interface ProjectsListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export default function ProjectsList({ projects, onEdit, onDelete }: ProjectsListProps) {
  const [deletingProject, setDeletingProject] = useState<string | null>(null);

  const handleDeleteClick = (project: Project) => {
    if (deletingProject === project.id) {
      // Double click - actually delete
      onDelete(project);
      setDeletingProject(null);
    } else {
      // First click - show confirmation
      setDeletingProject(project.id);
      // Reset after 3 seconds
      setTimeout(() => setDeletingProject(null), 3000);
    }
  };
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">ยังไม่มีโปรเจคในระบบ</div>
        <div className="text-gray-400 text-sm mt-2">กดปุ่ม &quot;เพิ่มโปรเจคใหม่&quot; เพื่อเริ่มต้น</div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  โปรเจค
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ขนาด
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หมวดหมู่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ปี
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รูปภาพ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => {
                const afterImages = getAfterImages(project);
                const beforeImages = getBeforeImages(project);
                const hasBeforeImages = beforeImages.length > 0;

                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {project.featured_image && (
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded object-cover"
                              src={project.featured_image}
                              alt={project.title}
                            />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {project.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {project.width} x {project.extension} เมตร
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {project.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-xs text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">หลังทำงาน:</span>
                          <span>{afterImages.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">ก่อนทำงาน:</span>
                          <span>{beforeImages.length}</span>
                          {!hasBeforeImages && (
                            <span className="text-[11px] font-medium text-amber-600">
                              ไม่มีรูปก่อนทำงาน
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <a
                        href={`/portfolio/${project.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1.5 text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
                        title="ดูโปรเจคในเว็บไซต์"
                      >
                        ดูหน้าเว็บ
                      </a>
                      <button
                        onClick={() => onEdit(project)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1.5 text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteClick(project)}
                        className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 transition-colors ${
                          deletingProject === project.id
                            ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                            : 'border-gray-200 text-red-600 hover:border-red-300 hover:text-red-700'
                        }`}
                      >
                        {deletingProject === project.id ? 'กดอีกครั้งเพื่อลบ' : 'ลบ'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="bg-white px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            แสดงโปรเจคทั้งหมด {projects.length} รายการ
          </div>
        </div>
      </div>

      {/* Mobile Card View - Shown on mobile only */}
      <div className="lg:hidden space-y-4">
        {projects.map((project) => {
          const afterImages = getAfterImages(project);
          const beforeImages = getBeforeImages(project);
          const hasBeforeImages = beforeImages.length > 0;

          return (
            <div
              key={project.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              {/* Project Header with Image */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-start gap-4">
                  {project.featured_image && (
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                      <img
                        className="h-full w-full object-cover"
                        src={project.featured_image}
                        alt={project.title}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-md font-medium text-gray-900">
               หน้ากว้าง {project.width} ม. x ยื่นออก {project.extension} ม.
                    </h3>
                    {/* <p className="truncate text-sm text-gray-500">{project.slug}</p> */}

                {/* Before/After Images Info */}
                <div className="flex items-baseline space-x-5 border-t border-gray-100 pt-3 text-sm">
                  <div className="flex items-baseline space-x-1 justify-between truncate text-sm text-gray-500">
                    <span>รูปหลังติดตั้ง</span>
                    <span className="font-medium truncate text-sm text-gray-500">{afterImages.length}</span>
                  </div>
                  <div className="flex items-baseline  space-x-1 justify-between truncate text-sm text-gray-500">
                    <span>รูปก่อนติดตั้ง</span>
                    <span className="font-medium truncate text-sm text-gray-500">{beforeImages.length}</span>
                  </div>

                </div>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">ขนาด:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {project.width} x {project.extension} ม.
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">ปี:</span>
                    <span className="ml-1 font-medium text-gray-900">{project.year}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">สถานที่:</span>
                    <span className="ml-1 font-medium text-gray-900">{project.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ประเภท:</span>
                    <span className="ml-1 inline-flex items-center rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {project.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <span className="text-gray-500">หมวดหมู่:</span>
                  <span className="ml-2 inline-flex items-center rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {project.category}
                  </span>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <div className="grid gap-2">
                  <a
                    href={`/portfolio/${project.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900 active:scale-[0.99]"
                    title="ดูโปรเจคในเว็บไซต์"
                  >
                    ดูหน้าเว็บ
                  </a>
                  <button
                    onClick={() => onEdit(project)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900 active:scale-[0.99]"
                  >
                    แก้ไขรายละเอียด
                  </button>
                  <button
                    onClick={() => handleDeleteClick(project)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-center text-sm font-semibold transition-colors active:scale-[0.99] ${
                      deletingProject === project.id
                        ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                        : 'border-gray-200 text-red-600 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    {deletingProject === project.id ? 'กดยืนยันการลบ' : 'ลบโปรเจค'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Footer */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
          <div className="text-sm text-gray-500 text-center">
            แสดงโปรเจคทั้งหมด {projects.length} รายการ
          </div>
        </div>
      </div>
    </>
  );
}
