"use client";

import dynamic from "next/dynamic";

/**
 * The real content (and everything it imports - ArticleForm, adminFetch,
 * browser-only editor code loads client-side; APIs enforce access on the server.
 */
const ArticlesAdminClient = dynamic(() => import("./ArticlesAdminClient"), { ssr: false });

export default function AdminArticlesPage() {
  return <ArticlesAdminClient />;
}
