"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  slug: string;
}

/**
 * ViewTracker Component
 *
 * This lightweight client component tracks project views without affecting SEO or page load.
 *
 * Features:
 * - Fire-and-forget: Doesn't wait for API response
 * - Session-based: Uses sessionStorage to prevent duplicate counts in the same session
 * - Non-blocking: Doesn't affect page rendering or user experience
 * - SEO-friendly: Small client component, doesn't interfere with SSG
 *
 * Usage:
 * <ViewTracker slug={project.slug} />
 */
export default function ViewTracker({ slug }: ViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate tracking in the same session
    const sessionKey = `viewed_project_${slug}`;

    // Check if already viewed in this session
    if (typeof window !== "undefined") {
      const alreadyViewed = sessionStorage.getItem(sessionKey);

      if (alreadyViewed || hasTracked.current) {
        return;
      }

      // Mark as tracked in this component instance
      hasTracked.current = true;

      // Mark as viewed in this session
      sessionStorage.setItem(sessionKey, Date.now().toString());

      // Fire-and-forget: Track view without waiting for response
      fetch(`/api/projects/${slug}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((error) => {
        // Silently fail - view tracking is not critical
        console.debug("View tracking error:", error);
      });
    }
  }, [slug]);

  // This component doesn't render anything
  return null;
}
