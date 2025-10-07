import { NextResponse } from "next/server";
import { writeFile, mkdir, stat } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await (file as File).arrayBuffer());
  const ext = path.extname((file as File).name) || ".bin";
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
}


