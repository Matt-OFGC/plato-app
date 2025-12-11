import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Upload photo for a task completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { companyId } = await getCurrentUserAndCompany();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const checklistItemId = formData.get("checklistItemId") as string | null;
    const isBeforePhoto = formData.get("isBeforePhoto") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Verify task completion exists and belongs to company
    const completion = await prisma.$queryRaw<any[]>`
      SELECT id FROM "TaskCompletion"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (completion.length === 0) {
      return NextResponse.json({ error: "Task completion not found" }, { status: 404 });
    }

    // TODO: Upload file to S3/Cloudinary/etc
    // For now, we'll simulate file upload
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `/safety-photos/${companyId}/${id}/${fileName}`;
    const thumbnailPath = `/safety-photos/${companyId}/${id}/thumb-${fileName}`;

    // Get file size and type
    const fileSize = file.size;
    const mimeType = file.type;

    // Save photo record to database
    const photo = await prisma.$queryRaw<any[]>`
      INSERT INTO "TaskPhoto" (
        "taskCompletionId", "checklistItemId", "companyId",
        "filePath", "fileName", "fileSize", "mimeType",
        "isBeforePhoto", "uploadedBy", "uploadedAt", "thumbnailPath"
      )
      VALUES (
        ${parseInt(id)},
        ${checklistItemId ? parseInt(checklistItemId) : null},
        ${companyId},
        ${filePath},
        ${file.name},
        ${fileSize},
        ${mimeType},
        ${isBeforePhoto},
        ${session.id},
        CURRENT_TIMESTAMP,
        ${thumbnailPath}
      )
      RETURNING *
    `;

    // Update photo count on completion
    await prisma.$executeRaw`
      UPDATE "TaskCompletion"
      SET "photosCount" = "photosCount" + 1
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json({
      success: true,
      photo: photo[0],
    });
  } catch (error) {
    logger.error("Photo upload error", error, "Safety/Tasks");
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

// Get photos for a task completion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { companyId } = await getCurrentUserAndCompany();

    const photos = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TaskPhoto"
      WHERE "taskCompletionId" = ${parseInt(id)} AND "companyId" = ${companyId}
      ORDER BY "uploadedAt" ASC
    `;

    return NextResponse.json(photos);
  } catch (error) {
    logger.error("Get photos error", error, "Safety/Tasks");
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

