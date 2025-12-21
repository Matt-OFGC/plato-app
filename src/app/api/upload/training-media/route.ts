import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Configure the route segment to handle large uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for video uploads

// Max file size: 50MB for training media (videos can be large)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Upload training media (images, videos)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check permission - relaxed for MVP (allow ADMIN and OWNER)
    // For MVP, we'll check role directly instead of using checkPermission
    const { prisma } = await import("@/lib/prisma");
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId,
        },
      },
    });

    if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
      return NextResponse.json(
        { error: "No permission to upload training media" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo", // .avi
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, QuickTime) are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    logger.debug("Processing training media upload...", { fileName: file.name, size: file.size, type: file.type });
    
    // Try Vercel Blob storage first if configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const fileName = `training/${companyId}/${Date.now()}-${file.name}`;
      const blob = await put(fileName, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      
      logger.info("Training media uploaded successfully to Vercel Blob:", blob.url);
      
      return NextResponse.json({ 
        url: blob.url,
        fileName: file.name,
        size: file.size,
        type: file.type,
      });
    }
    
    // Fallback: Save to local public/uploads/training directory
    logger.debug("Blob storage not configured, saving to local storage");
    
    // Create uploads/training directory if it doesn't exist
    const rootPublic = join(process.cwd(), 'public', 'uploads', 'training');
    const appPublic = join(process.cwd(), 'src', 'app', 'public', 'uploads', 'training');
    const uploadsDir = existsSync(join(process.cwd(), 'public')) ? rootPublic : appPublic;
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || (file.type.startsWith('image/') ? 'jpg' : 'mp4');
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);
    
    // Convert File to Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    
    // Return public URL
    const publicUrl = `/uploads/training/${fileName}`;
    logger.info("Training media uploaded successfully to local storage:", publicUrl);

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    logger.error("Upload training media error", error, "Upload/TrainingMedia");
    return NextResponse.json(
      { error: "Failed to upload file: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

