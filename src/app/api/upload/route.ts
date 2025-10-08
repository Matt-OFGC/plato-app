import { NextResponse } from "next/server";
import { writeFile, mkdir, stat } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Configure route to accept larger files - 10MB max
export const config = {
  api: {
    bodyParser: false,
  },
};

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileObj = file as File;
    
    // Check file size
    if (fileObj.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Validate file type
    if (!fileObj.type.startsWith('image/')) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await fileObj.arrayBuffer());
    const ext = path.extname(fileObj.name) || ".bin";
    const base = crypto.randomBytes(16).toString("hex");
    const fileName = `${base}${ext.toLowerCase()}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    try {
      await stat(uploadDir);
    } catch {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    const publicUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


