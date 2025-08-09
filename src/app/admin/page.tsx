'use client';

import ProtectedRoute from '../../components/admin/ProtectedRoute';
import AdminLayout from '../../components/admin/AdminLayout';
import ProjectForm from '../../components/admin/ProjectForm';
import { AuthProvider } from '../../contexts/AuthContext';

export default function AdminPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <ProjectForm />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}