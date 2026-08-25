'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

/**
 * Firebase Auth's client SDK triggers a dynamic eval() during module init,
 * which Cloudflare Workers blocks by default ("Code generation from strings
 * disallowed for this context"). Next.js still does one server-render pass
 * for 'use client' pages, so importing this gate directly would crash the
 * Worker. Callers must load it via next/dynamic with { ssr: false } so
 * firebase/auth never gets evaluated on the server.
 */
export default function AdminAuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>{children}</ProtectedRoute>
    </AuthProvider>
  );
}
