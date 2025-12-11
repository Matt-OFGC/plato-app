import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated as admin
    const session = await getAdminSession();
    logger.debug("Admin upload - Session check", { hasSession: !!session }, "Admin/Upload");
    if (!session) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = {
      logo: [".svg", ".png", ".jpg", ".jpeg"],
      favicon: [".png", ".ico"],
      image: [".png", ".jpg", ".jpeg", ".svg"]
    };

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes[type as keyof typeof allowedTypes]?.includes(fileExtension)) {
      return NextResponse.json({ 
        error: `Invalid file type for ${type}. Allowed: ${allowedTypes[type as keyof typeof allowedTypes]?.join(", ")}` 
      }, { status: 400 });
    }

    // Determine file path based on type
    let fileName: string;
    let filePath: string;

    switch (type) {
      case "logo":
        fileName = "plato-logo" + fileExtension;
        filePath = join(process.cwd(), "public", "images", fileName);
        break;
      case "favicon":
        fileName = file.name;
        filePath = join(process.cwd(), "public", fileName);
        break;
      case "image":
        fileName = file.name;
        filePath = join(process.cwd(), "public", "images", fileName);
        break;
      default:
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Ensure directory exists
    const dir = join(filePath, "..");
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    logger.info(`File uploaded successfully`, { fileName, type }, "Admin/Upload");

    return NextResponse.json({ 
      success: true,
      message: `${type} uploaded successfully!`,
      fileName,
      filePath: filePath.replace(process.cwd(), "")
    });

  } catch (error) {
    logger.error("File upload error", error, "Admin/Upload");
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
