import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
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
        fileName = "plato-logo.svg";
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

    return NextResponse.json({ 
      success: true,
      message: `${type} uploaded successfully!`,
      fileName,
      filePath: filePath.replace(process.cwd(), "")
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
