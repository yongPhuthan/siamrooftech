// app/api/projects/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { projectsAdminService } from "@/lib/firestore-admin";
import { Project } from "@/lib/firestore";

// GET: ดึงข้อมูลโปรเจกต์
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<Project | { error: string }>> {
  try {
    const { slug } = await params;

    // Step 1: ลองดึงจาก Firestore โดยตรง (ถือว่าเป็น source of truth)
    let project = await projectsAdminService.getBySlug(slug);
    if (!project) {
      project = await projectsAdminService.getById(slug);
    }

    // Step 2: ถ้าไม่มีข้อมูล → ส่ง 404
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Step 3: คืนค่าข้อมูล + ให้ tag สำหรับ ISR cache
    return NextResponse.json(project, {
      status: 200,
      headers: {
        "x-revalidate-tag": `project-${slug}`,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project data" },
      { status: 500 }
    );
  }
}

// POST: on-demand revalidation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { secret } = body;

    if (secret !== process.env.REVALIDATION_SECRET_TOKEN) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    revalidateTag(`project-${slug}`);

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: `Revalidated project-${slug}`,
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}

// DELETE: ลบโปรเจค
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    const { slug } = await params;

    // Delete the project
    const success = await projectsAdminService.deleteBySlug(slug);

    if (!success) {
      return NextResponse.json(
        { error: "Project not found or could not be deleted" },
        { status: 404 }
      );
    }

    // Revalidate cache after deletion
    revalidateTag("projects");
    revalidateTag(`project-${slug}`);

    return NextResponse.json({
      success: true,
      message: `Project ${slug} deleted successfully`
    }, {
      status: 200
    });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
