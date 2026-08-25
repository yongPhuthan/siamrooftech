"use client";

import { useState, useEffect } from "react";
import { Project } from "../../../lib/firestore";
import ProjectsList from "../../components/admin/ProjectsList";
import ProjectForm from "../../../components/admin/ProjectForm";
import AdminAuthGate from "../../../components/admin/AdminAuthGate";
import { adminFetch } from "../../../lib/admin-fetch";

export default function ProjectsAdminClient() {
  return (
    <AdminAuthGate>
      <AdminProjectsContent />
    </AdminAuthGate>
  );
}

function AdminProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchProjects = async () => {
    try {
      console.log('🔄 Fetching projects from /api/projects');

      const response = await fetch('/api/projects');
      console.log('📡 Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Raw API response:', data);
        console.log('📋 Response type:', typeof data);
        console.log('📋 Is array?', Array.isArray(data));

        // API returns array directly, not wrapped in an object
        const projectsData = Array.isArray(data) ? data : (data.projects || []);
        console.log('📋 Final projects data:', projectsData);
        console.log('📋 Number of projects:', projectsData.length);

        setProjects(projectsData);
      } else {
        console.error('❌ API response not ok:', response.status, await response.text());
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบโปรเจค "${project.title}"?`)) {
      try {
        const response = await adminFetch(`/api/projects/${project.slug}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProjects(projects.filter(p => p.id !== project.id));
          alert('ลบโปรเจคสำเร็จ');
        } else {
          alert('เกิดข้อผิดพลาดในการลบโปรเจค');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('เกิดข้อผิดพลาดในการลบโปรเจค');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProject(null);
    fetchProjects();
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Form Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {editingProject ? 'แก้ไขโปรเจค' : 'เพิ่มโปรเจคใหม่'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {editingProject ? 'แก้ไขข้อมูลโปรเจคที่มีอยู่' : 'เพิ่มโปรเจคใหม่เข้าสู่ระบบ'}
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingProject(null);
            }}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100 shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            ยกเลิก
          </button>
        </div>

        <ProjectForm
          project={editingProject}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">จัดการโปรเจค</h1>
          <p className="mt-1 text-sm text-gray-500">
            แก้ไข เพิ่ม หรือลบโปรเจคในระบบ
          </p>
        </div>
        <button
          onClick={handleNewProject}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors active:bg-blue-800 shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          เพิ่มโปรเจคใหม่
        </button>
      </div>

      <ProjectsList
        projects={projects}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
