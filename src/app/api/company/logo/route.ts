import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File;
    const companyId = formData.get("companyId") as string;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing file or invalid file type" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: "Missing company ID" }, { status: 400 });
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

    // Check if Blob storage is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN not configured");
      return NextResponse.json({ 
        error: "Storage not configured. Please contact support." 
      }, { status: 500 });
    }

    // Upload to Vercel Blob storage with company-specific naming
    const blob = await put(`company-logos/${companyId}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Update company with logo URL
    await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: { logoUrl: blob.url },
    });

    return NextResponse.json({ success: true, logoUrl: blob.url });
  } catch (error) {
    console.error("Logo upload error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: "Upload failed: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 });
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

