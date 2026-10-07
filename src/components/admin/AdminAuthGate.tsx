'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

/** Admin auth UI stays in the browser; route handlers verify every request server-side. */
export default function AdminAuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>{children}</ProtectedRoute>
    </AuthProvider>
  );
}
