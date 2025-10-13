import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';
import { getSession } from "@/lib/auth-simple";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";
import { getCurrentUserAndCompany } from "@/lib/current";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Configure the route segment to handle large uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = rateLimit(req, RATE_LIMITS.UPLOAD);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many upload attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) }
        }
      );
    }
    
    console.log("Upload request received");
    
    const form = await req.formData();
    console.log("FormData parsed successfully");
    
    const file = form.get("file");
    
    if (!file || typeof file === "string") {
      console.error("No file in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileObj = file as File;
    console.log("File received:", fileObj.name, "Size:", fileObj.size, "Type:", fileObj.type);
    
    // Check file size
    if (fileObj.size > MAX_FILE_SIZE) {
      console.error("File too large:", fileObj.size);
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Validate file type
    if (!fileObj.type.startsWith('image/')) {
      console.error("Invalid file type:", fileObj.type);
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    console.log("Uploading to Vercel Blob storage...");
    
    // Check if Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN not configured");
      return NextResponse.json({ 
        error: "Storage not configured. Please set up Vercel Blob storage." 
      }, { status: 500 });
    }
    
    // Upload to Vercel Blob storage
    const blob = await put(fileObj.name, fileObj, {
      access: 'public',
      addRandomSuffix: true,
    });
    
    console.log("File uploaded successfully to:", blob.url);

    // Audit file upload
    const { companyId } = await getCurrentUserAndCompany();
    if (companyId) {
      await auditLog.fileUploaded(session.id, companyId, fileObj.name, fileObj.size);
    }
    
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 });
  }
}


