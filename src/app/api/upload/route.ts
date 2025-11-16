import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';
import { getSession } from "@/lib/auth-simple";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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
    const uploadRateLimit = RATE_LIMITS.UPLOAD || {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 20
    };
    const rateLimitResult = rateLimit(req, uploadRateLimit);
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
    
    // Try Vercel Blob storage first if configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(fileObj.name, fileObj, {
        access: 'public',
        addRandomSuffix: true,
      });
      
      logger.info("File uploaded successfully to Vercel Blob:", blob.url);
      
      // Audit file upload
      try {
        const { companyId } = await getCurrentUserAndCompany();
        if (companyId) {
          await auditLog.fileUploaded(session.id, companyId, fileObj.name, fileObj.size);
        }
      } catch (auditError) {
        logger.error("Audit log error (non-blocking):", auditError);
      }
      
      return NextResponse.json({ url: blob.url });
    }
    
    // Fallback: Save to local public/uploads directory
    logger.debug("Blob storage not configured, saving to local storage");
    
    // Create uploads directory if it doesn't exist
    // Try root public first, then src/app/public as fallback
    const rootPublic = join(process.cwd(), 'public', 'uploads');
    const appPublic = join(process.cwd(), 'src', 'app', 'public', 'uploads');
    const uploadsDir = existsSync(join(process.cwd(), 'public')) ? rootPublic : appPublic;
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileObj.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);
    
    // Convert File to Buffer and save
    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    
    // Return public URL
    const publicUrl = `/uploads/${fileName}`;
    logger.info("File uploaded successfully to local storage:", publicUrl);
    
    // Audit file upload
    try {
      const { companyId } = await getCurrentUserAndCompany();
      if (companyId) {
        await auditLog.fileUploaded(session.id, companyId, fileObj.name, fileObj.size);
      }
    } catch (auditError) {
      logger.error("Audit log error (non-blocking):", auditError);
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    logger.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 });
  }
}


