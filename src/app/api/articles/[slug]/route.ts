import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { articlesAdminService } from "@/lib/firestore-admin";
import { Article } from "@/lib/firestore";
import { adminDb } from "@/lib/firebase-admin";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET: ดึงบทความตาม slug
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<Article | { error: string }>> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { slug } = await context.params;

    const article = await articlesAdminService.getBySlug(slug);

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const totalTime = Date.now() - startTime;

    return NextResponse.json(article, {
      status: 200,
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
        error: "Failed to fetch article",
        requestId,
        executionTime: totalTime
      },
      { status: 500 }
    );
  }
}

// PUT: แก้ไขบทความ
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not available" },
        { status: 500 }
      );
    }

    const { slug } = await context.params;
    const body = await request.json();

    // Find article by slug
    const article = await articlesAdminService.getBySlug(slug);
    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Update article data
    const updateData: Partial<Article> = {
      ...body,
      updated_at: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    // Remove id from update data to avoid overwriting
    delete (updateData as any).id;

    // Update in Firestore
    const articleRef = adminDb.collection('articles').doc(article.id);
    await articleRef.update(updateData);

    const updatedArticle = {
      ...article,
      ...updateData,
    };

    // Revalidate caches
    revalidateTag('articles');
    revalidateTag(`article-${slug}`);

    const totalTime = Date.now() - startTime;

    return NextResponse.json(updatedArticle, {
      status: 200,
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
        error: "Failed to update article",
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        executionTime: totalTime
      },
      { status: 500 }
    );
  }
}

// DELETE: ลบบทความ
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not available" },
        { status: 500 }
      );
    }

    const { slug } = await context.params;

    // Find article by slug
    const article = await articlesAdminService.getBySlug(slug);
    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Delete from Firestore
    const articleRef = adminDb.collection('articles').doc(article.id);
    await articleRef.delete();

    // Revalidate caches
    revalidateTag('articles');
    revalidateTag(`article-${slug}`);

    const totalTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        message: "Article deleted successfully",
        articleId: article.id,
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
          "x-execution-time": totalTime.toString(),
        },
      }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API-${requestId}] Error after ${totalTime}ms:`, error);
    return NextResponse.json(
      {
        error: "Failed to delete article",
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        executionTime: totalTime
      },
      { status: 500 }
    );
  }
}

// PATCH: Toggle publish status
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not available" },
        { status: 500 }
      );
    }

    const { slug } = await context.params;
    const body = await request.json();
    const { isPublished } = body;

    // Find article by slug
    const article = await articlesAdminService.getBySlug(slug);
    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Update publish status
    const articleRef = adminDb.collection('articles').doc(article.id);
    await articleRef.update({
      isPublished,
      published_at: isPublished ? new Date().toISOString() : article.published_at,
      updated_at: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    });

    // Revalidate caches
    revalidateTag('articles');
    revalidateTag(`article-${slug}`);

    const totalTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        isPublished,
        articleId: article.id,
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
          "x-execution-time": totalTime.toString(),
        },
      }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API-${requestId}] Error after ${totalTime}ms:`, error);
    return NextResponse.json(
      {
        error: "Failed to toggle publish status",
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        executionTime: totalTime
      },
      { status: 500 }
    );
  }
}
