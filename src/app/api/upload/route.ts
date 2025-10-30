import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';
import { getSession } from "@/lib/auth-simple";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Max file size: 5MB (to stay under Vercel's 6MB serverless function limit)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Configure the route segment to handle large uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max

export async function POST(req: NextRequest) {
  try {
    logger.debug("Upload API called");
    
    // Check authentication
    const session = await getSession();
    logger.debug("Session check:", session ? "authenticated" : "not authenticated");
    if (!session) {
      logger.debug("Returning 401 - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = rateLimit(req, RATE_LIMITS.UPLOAD);
    logger.debug("Rate limit check:", rateLimitResult);
    if (!rateLimitResult.allowed) {
      logger.warn("Rate limited, retry after:", rateLimitResult.retryAfter);
      return NextResponse.json(
        { error: `Too many upload attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) }
        }
      );
    }
    
    logger.debug("Upload request received");
    
    const form = await req.formData();
    logger.debug("FormData parsed successfully");
    
    const file = form.get("file");
    
    if (!file || typeof file === "string") {
      logger.error("No file in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileObj = file as File;
    logger.debug("File received:", fileObj.name, "Size:", fileObj.size, "Type:", fileObj.type);
    
    // Check file size
    if (fileObj.size > MAX_FILE_SIZE) {
      logger.warn("File too large:", fileObj.size);
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Validate file type
    if (!fileObj.type.startsWith('image/')) {
      logger.warn("Invalid file type:", fileObj.type);
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    logger.debug("Processing image upload...");
    
    // For now, return a placeholder URL since blob storage isn't configured
    // In production, you would upload to Vercel Blob, AWS S3, or another service
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logger.debug("Blob storage not configured, using placeholder URL");
      const placeholderUrl = `/api/placeholder-image?name=${encodeURIComponent(fileObj.name)}&size=${fileObj.size}`;
      return NextResponse.json({ url: placeholderUrl });
    }
    
    // Upload to Vercel Blob storage (if configured)
    const blob = await put(fileObj.name, fileObj, {
      access: 'public',
      addRandomSuffix: true,
    });
    
    logger.info("File uploaded successfully to:", blob.url);

    // Audit file upload (simplified to avoid performance issues)
    try {
      const { companyId } = await getCurrentUserAndCompany();
      if (companyId) {
        await auditLog.fileUploaded(session.id, companyId, fileObj.name, fileObj.size);
      }
    } catch (auditError) {
      logger.error("Audit log error (non-blocking):", auditError);
      // Don't fail the upload if audit logging fails
    }
    
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    logger.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 });
  }
}


