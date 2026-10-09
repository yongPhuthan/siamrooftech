'use client';

import dynamic from 'next/dynamic';

/**
 * The real content (and everything it imports - browser-only UI modules)
 * must load client-only. See AdminAuthGate for why.
 */
const ImageUploadAdminClient = dynamic(() => import('./ImageUploadAdminClient'), { ssr: false });

export default function AdminImageUploadPage() {
  return <ImageUploadAdminClient />;
}
