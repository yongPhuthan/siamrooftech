"use client";

import dynamic from "next/dynamic";

/**
 * The real content (and everything it imports - ProjectForm, adminFetch,
 * browser-only editor code loads client-side; APIs enforce access on the server.
 */
const ProjectsAdminClient = dynamic(() => import("./ProjectsAdminClient"), { ssr: false });

export default function AdminProjectsPage() {
  return <ProjectsAdminClient />;
}
