"use client";

import dynamic from "next/dynamic";

/**
 * The real content (and everything it imports - adminFetch, the browser auth
 * client SDK) must load client-only. See AdminAuthGate for why.
 */
const CrmWorkspace = dynamic(() => import("@/features/lead-crm/CrmWorkspace"), { ssr: false });

export default function AdminLeadsPage() {
  return <CrmWorkspace />;
}
