"use client";

import dynamic from "next/dynamic";

/**
 * The real content (and everything it imports - adminFetch, the Firebase
 * client SDK) must load client-only. See AdminAuthGate for why.
 */
const LeadsAdminClient = dynamic(() => import("./LeadsAdminClient"), { ssr: false });

export default function AdminLeadsPage() {
  return <LeadsAdminClient />;
}
