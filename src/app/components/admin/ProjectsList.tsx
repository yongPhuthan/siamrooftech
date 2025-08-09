"use client";

import { useState } from "react";
import { Project } from "../../../lib/firestore";

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
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
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
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      project.type === 'ระบบมือหมุน' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {project.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <a
                      href={`/portfolio/${project.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded transition-colors inline-block"
                      title="ดูโปรเจคในเว็บไซต์"
                    >
                      ดู
                    </a>
                    <button
                      onClick={() => onEdit(project)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteClick(project)}
                      className={`px-3 py-1 rounded transition-colors ${
                        deletingProject === project.id
                          ? 'text-white bg-red-600 hover:bg-red-700'
                          : 'text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      {deletingProject === project.id ? 'กดอีกครั้งเพื่อลบ' : 'ลบ'}
                    </button>
                  </td>
                </tr>
              ))}
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
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Project Header with Image */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {project.featured_image && (
                    <div className="flex-shrink-0">
                      <img
                        className="h-20 w-20 rounded-xl object-cover shadow-sm"
                        src={project.featured_image}
                        alt={project.title}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {project.slug}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="p-4 space-y-3">
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
                  <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${
                    project.type === 'ระบบมือหมุน' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {project.type}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-500 text-sm">หมวดหมู่:</span>
                <span className="ml-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {project.category}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex space-x-2">
                <a
                  href={`/portfolio/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-600 text-white text-center py-2.5 px-3 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors active:bg-green-800 active:scale-95"
                  title="ดูโปรเจคในเว็บไซต์"
                >
                  👁️ ดู
                </a>
                <button
                  onClick={() => onEdit(project)}
                  className="flex-1 bg-blue-600 text-white text-center py-2.5 px-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors active:bg-blue-800 active:scale-95"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  onClick={() => handleDeleteClick(project)}
                  className={`flex-1 text-center py-2.5 px-3 rounded-lg font-medium text-sm transition-colors active:scale-95 ${
                    deletingProject === project.id
                      ? 'bg-red-700 text-white hover:bg-red-800'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {deletingProject === project.id ? (
                    <>⚠️ กดอีกครั้ง</>
                  ) : (
                    <>🗑️ ลบ</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Mobile Footer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 text-center">
            แสดงโปรเจคทั้งหมด {projects.length} รายการ
          </div>
        </div>
      </div>
    </>
  );
}