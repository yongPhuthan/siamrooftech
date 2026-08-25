"use client";

import dynamic from "next/dynamic";

/**
 * The real content (and everything it imports - ProjectForm, adminFetch,
 * the Firebase client SDK) must load client-only. See AdminAuthGate for why.
 */
const ProjectsAdminClient = dynamic(() => import("./ProjectsAdminClient"), { ssr: false });

export default function AdminProjectsPage() {
  return <ProjectsAdminClient />;
}
