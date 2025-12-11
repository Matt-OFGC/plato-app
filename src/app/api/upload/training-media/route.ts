import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

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

    // Check permission
    const canEdit = await checkPermission(
      session.id,
      companyId,
      "training:edit"
    );
    if (!canEdit) {
      return NextResponse.json(
        { error: "No permission to upload training media" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
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
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and videos are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // TODO: Upload to storage service (Vercel Blob, AWS S3, etc.)
    // For now, return a placeholder URL
    // In production, you would:
    // 1. Upload to your storage service
    // 2. Get the public URL
    // 3. Return the URL

    const fileName = `${companyId}/${Date.now()}-${file.name}`;
    const fileUrl = `/uploads/training/${fileName}`;

    // In a real implementation, you would upload here:
    // const { put } = await import('@vercel/blob');
    // const blob = await put(fileName, file, { access: 'public' });
    // return NextResponse.json({ url: blob.url });

    return NextResponse.json({
      url: fileUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    logger.error("Upload training media error", error, "Upload/TrainingMedia");
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

