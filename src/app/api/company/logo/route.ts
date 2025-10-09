import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File;
    const companyId = formData.get("companyId") as string;

    if (!file || !companyId) {
      return NextResponse.json({ error: "Missing file or company ID" }, { status: 400 });
    }

    // Check if user has access to this company
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId: parseInt(companyId),
        },
      },
    });

    if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
      return NextResponse.json({ error: "No permission to update company" }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload an image." }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "logos");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `company-${companyId}-${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update company with logo URL
    const logoUrl = `/uploads/logos/${filename}`;
    await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: { logoUrl },
    });

    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 });
    }

    // Check if user has access to this company
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId: parseInt(companyId),
        },
      },
    });

    if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
      return NextResponse.json({ error: "No permission to update company" }, { status: 403 });
    }

    // Remove logo URL from database
    await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: { logoUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logo delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

