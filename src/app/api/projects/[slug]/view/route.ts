import { NextRequest, NextResponse } from "next/server";
import { projectsAdminService } from "@/lib/firestore-admin";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * POST /api/projects/[slug]/view
 * Increment view count for a project
 *
 * This endpoint is called by the client-side ViewTracker component
 * when a user views a project detail page.
 *
 * Features:
 * - Atomic increment using Firestore FieldValue.increment
 * - Fire-and-forget pattern for performance
 * - No authentication required (public endpoint)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Find project by slug to get the ID
    const project = await projectsAdminService.getBySlug(slug);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Increment view count
    const success = await projectsAdminService.incrementViewCount(project.id);

    if (!success) {
      console.error(`Failed to increment view count for project: ${project.id}`);
      // Still return success to client (fire-and-forget pattern)
      return NextResponse.json(
        { success: false, message: "Failed to increment view count" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        projectId: project.id,
        slug: slug
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("View tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
