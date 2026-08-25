"use client";

import dynamic from "next/dynamic";

/**
 * The real content (and everything it imports - ArticleForm, adminFetch,
 * the Firebase client SDK) must load client-only. See AdminAuthGate for why.
 */
const ArticlesAdminClient = dynamic(() => import("./ArticlesAdminClient"), { ssr: false });

export default function AdminArticlesPage() {
  return <ArticlesAdminClient />;
}
