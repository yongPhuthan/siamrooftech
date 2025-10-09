import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { articlesAdminService } from "@/lib/firestore-admin";
import { Article } from "@/lib/firestore";
import { adminDb } from "@/lib/firebase-admin";

// GET: ดึงข้อมูลบทความทั้งหมด (รวม draft สำหรับ admin)
export async function GET(
  request: NextRequest
): Promise<NextResponse<Article[] | { error: string }>> {
  const startTime = Date.now();
  const debugMode = process.env.NODE_ENV === 'development' || process.env.CACHE_DEBUG === 'true';
  const requestId = Math.random().toString(36).substring(7);

  // Check if request wants all articles (including drafts) - for admin
  const { searchParams } = new URL(request.url);
  const includeDrafts = searchParams.get('includeDrafts') === 'true';

  try {
    if (debugMode) {
      console.log(`🔄 [API-${requestId}] Starting articles fetch from Firestore...`);
      console.log(`📋 [API-${requestId}] Include drafts: ${includeDrafts}`);
    }

    let articles = await articlesAdminService.getAll();
    const fetchTime = Date.now() - startTime;

    if (!articles) {
      console.log(`❌ [API-${requestId}] No articles found (${fetchTime}ms)`);
      return NextResponse.json({ error: "Articles not found" }, { status: 404 });
    }

    // Filter out drafts if not admin request
    if (!includeDrafts) {
      articles = articles.filter(article => article.isPublished !== false);
    }

    const totalTime = Date.now() - startTime;

    if (debugMode) {
      console.log(`✅ [API-${requestId}] Fetched ${articles.length} articles (${totalTime}ms)`);
      console.log(`📊 [API-${requestId}] Data source: FIRESTORE ADMIN`);
    }

    const headers: Record<string, string> = {
      "x-revalidate-tag": "articles",
      "x-data-source": "firestore-admin",
      "x-fetch-time": fetchTime.toString(),
      "x-total-time": totalTime.toString(),
      "x-item-count": articles.length.toString(),
      "x-request-id": requestId,
    };

    return NextResponse.json(articles, {
      status: 200,
      headers,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API-${requestId}] Error after ${totalTime}ms:`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch articles",
        requestId,
        executionTime: totalTime
      },
      { status: 500 }
    );
  }
}

// POST: สร้างบทความใหม่
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not available" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log(`📝 [API-${requestId}] Creating new article: ${body.title}`);

    // Generate slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Prepare article data
    const now = new Date().toISOString();
    const isPublished = body.isPublished ?? false;

    const articleData: Partial<Article> = {
      ...body,
      slug,
      isPublished,
      viewCount: 0,
      created_at: now,
      updated_at: now,
      lastModified: now,
      // ✅ FIX: Set published_at ตั้งแต่ตอนสร้าง (null สำหรับ draft, timestamp สำหรับ published)
      published_at: isPublished ? now : null,
    };

    // Add to Firestore
    const articlesCol = adminDb.collection('articles');
    const docRef = await articlesCol.add(articleData);

    const newArticle = {
      id: docRef.id,
      ...articleData,
    } as Article;

    // Revalidate articles cache
    revalidateTag('articles');

    const totalTime = Date.now() - startTime;
    console.log(`✅ [API-${requestId}] Created article ${docRef.id} (${totalTime}ms)`);

    return NextResponse.json(newArticle, {
      status: 201,
      headers: {
        "x-request-id": requestId,
        "x-execution-time": totalTime.toString(),
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API-${requestId}] Error after ${totalTime}ms:`, error);
    return NextResponse.json(
      {
        error: "Failed to create article",
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        executionTime: totalTime
      },
      { status: 500 }
    );
  }
}
