import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

interface RevalidateRequest {
  paths?: string[];
  tags?: string[];
  secret?: string;
  debug?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: RevalidateRequest = await request.json();
    const { paths, tags, secret, debug = false } = body;

    // Verify secret for production environments
    if (process.env.NODE_ENV === 'production' && secret !== process.env.REVALIDATION_SECRET_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid or missing secret token' },
        { status: 401 }
      );
    }

    const results: any = {
      revalidated: true,
      timestamp: new Date().toISOString(),
      executionTime: 0,
      operations: []
    };

    // Revalidate by paths
    if (paths && Array.isArray(paths) && paths.length > 0) {
      for (const path of paths) {
        try {
          const pathStartTime = Date.now();
          revalidatePath(path);
          const pathExecutionTime = Date.now() - pathStartTime;
          
          results.operations.push({
            type: 'path',
            target: path,
            success: true,
            executionTime: pathExecutionTime
          });
          
          if (debug) {
            console.log(`✅ Revalidated path: ${path} (${pathExecutionTime}ms)`);
          }
        } catch (error) {
          results.operations.push({
            type: 'path',
            target: path,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          if (debug) {
            console.error(`❌ Failed to revalidate path: ${path}`, error);
          }
        }
      }
      results.paths = paths;
    }

    // Revalidate by tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tag of tags) {
        try {
          const tagStartTime = Date.now();
          revalidateTag(tag);
          const tagExecutionTime = Date.now() - tagStartTime;
          
          results.operations.push({
            type: 'tag',
            target: tag,
            success: true,
            executionTime: tagExecutionTime
          });
          
          if (debug) {
            console.log(`✅ Revalidated tag: ${tag} (${tagExecutionTime}ms)`);
          }
        } catch (error) {
          results.operations.push({
            type: 'tag',
            target: tag,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          if (debug) {
            console.error(`❌ Failed to revalidate tag: ${tag}`, error);
          }
        }
      }
      results.tags = tags;
    }

    // Validation
    if ((!paths || paths.length === 0) && (!tags || tags.length === 0)) {
      return NextResponse.json(
        { 
          error: 'Either paths array or tags array is required',
          received: { paths, tags }
        },
        { status: 400 }
      );
    }

    results.executionTime = Date.now() - startTime;

    if (debug) {
      console.log(`🔄 Revalidation completed in ${results.executionTime}ms:`, results);
    }

    return NextResponse.json(results);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Revalidation error:', error);
    
    return NextResponse.json({
      error: 'Failed to revalidate',
      message: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}