// app/api/projects/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { projectsAdminService } from "@/lib/firestore-admin";
import { Project } from "@/lib/firestore";

// GET: ดึงข้อมูลโปรเจกต์ พร้อม Debug logging
export async function GET(): Promise<
  NextResponse<Project[] | { error: string }>
> {
  const startTime = Date.now();
  const debugMode = process.env.NODE_ENV === 'development' || process.env.CACHE_DEBUG === 'true';
  const requestId = Math.random().toString(36).substring(7);

  try {
    if (debugMode) {
      console.log(`🔄 [API-${requestId}] Starting projects fetch from Firestore...`);
    }

    // Step 1: ลองดึงจาก Firestore โดยตรง (ถือว่าเป็น source of truth)
    let projects = await projectsAdminService.getAll();
    const fetchTime = Date.now() - startTime;

    console.log('🔍 [DEBUG] Projects from service:', projects);
    console.log('🔍 [DEBUG] Projects type:', typeof projects);
    console.log('🔍 [DEBUG] Projects length:', projects ? projects.length : 'null/undefined');

    // Step 2: ถ้าไม่มีข้อมูล → ส่ง 404
    if (!projects) {
      console.log(`❌ [API-${requestId}] No projects found (${fetchTime}ms)`);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Step 2.1: ถ้าเป็น array ว่าง → ส่งกลับ array ว่าง
    if (Array.isArray(projects) && projects.length === 0) {
      console.log(`📋 [API-${requestId}] Empty projects array (${fetchTime}ms)`);
      return NextResponse.json([], {
        status: 200,
        headers: {
          "x-revalidate-tag": "projects",
          "x-data-source": "firestore-admin",
          "x-item-count": "0",
          "x-request-id": requestId,
        }
      });
    }

    const sortedProjects = projects.sort((a, b) => {
      const dateA = a.completionDate
        ? new Date(a.completionDate).getTime()
        : new Date(Number(a.year), 0).getTime();
      const dateB = b.completionDate
        ? new Date(b.completionDate).getTime()
        : new Date(Number(b.year), 0).getTime();
      return dateB - dateA;
    });

    const totalTime = Date.now() - startTime;

    if (debugMode) {
      console.log(`✅ [API-${requestId}] Fetched ${projects.length} projects (${totalTime}ms)`);
      console.log(`📊 [API-${requestId}] Data source: FIRESTORE ADMIN`);
      console.log(`🏷️ [API-${requestId}] Cache Tag: "projects"`);
      console.log(`⏱️ [API-${requestId}] Breakdown: Fetch=${fetchTime}ms, Sort=${totalTime-fetchTime}ms`);
    }

    // Step 3: คืนค่าข้อมูล + ให้ tag สำหรับ ISR cache + debug headers
    const headers: Record<string, string> = {
      "x-revalidate-tag": "projects",
      "x-data-source": "firestore-admin",
      "x-fetch-time": fetchTime.toString(),
      "x-total-time": totalTime.toString(),
      "x-item-count": projects.length.toString(),
      "x-request-id": requestId,
    };

    if (debugMode) {
      headers["x-debug-mode"] = "true";
      headers["x-cache-status"] = "MISS"; // Since we're fetching from Firestore
    }

    return NextResponse.json(sortedProjects, {
      status: 200,
      headers,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API-${requestId}] Error after ${totalTime}ms:`, error);
    return NextResponse.json(
      { 
        error: "Failed to fetch project data",
        requestId,
        executionTime: totalTime
      },
      { status: 500 }
    );
  }
}

// POST: on-demand revalidation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;

    if (secret !== process.env.REVALIDATION_SECRET_TOKEN) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    revalidateTag(`projects`);

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: `Revalidated projects`,
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
