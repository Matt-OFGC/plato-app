import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getCurrentUserAndCompany } from "@/lib/current";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("logo");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No logo file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileExt = (file as any).name?.split(".").pop() || "png";
    const filename = `company-logo-${companyId}-${Date.now()}.${fileExt}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Logo upload failed", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}

export async function DELETE() {
  // No-op deletion placeholder to keep client flow working
  return NextResponse.json({ success: true });
}

