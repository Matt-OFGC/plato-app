import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Generate a random 4-6 digit PIN
function generatePin(length: number = 4): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// Assign or update PIN for a team member
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { membershipId, companyId, customPin } = body;

    if (!membershipId || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has permission to manage team
    const canManage = await checkPermission(session.id, companyId, "manage:team");
    if (!canManage) {
      return NextResponse.json({ error: "No permission to manage team" }, { status: 403 });
    }

    // Generate or use custom PIN
    const pin = customPin || generatePin(4);
    
    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }

    // Check if PIN is already in use by another member in this company
    const existingPin = await prisma.membership.findFirst({
      where: {
        companyId,
        pin,
        id: { not: membershipId },
        isActive: true,
      },
    });

    if (existingPin) {
      return NextResponse.json({ error: "PIN already in use by another team member" }, { status: 400 });
    }

    // Hash the PIN for security
    const pinHash = await bcrypt.hash(pin, 10);

    // Update membership with PIN
    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: { 
        pin,
        pinHash,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      pin, // Return the plain PIN so it can be shown to the admin once
      membership: updated,
    });
  } catch (error) {
    console.error("PIN assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign PIN" },
      { status: 500 }
    );
  }
}

// Verify PIN and authenticate team member on device
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, companyId } = body;

    if (!pin || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find membership with matching PIN
    const membership = await prisma.membership.findFirst({
      where: {
        companyId,
        pin,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!membership || !membership.pinHash) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // Verify PIN hash
    const isValid = await bcrypt.compare(pin, membership.pinHash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: membership.userId },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      user: membership.user,
      role: membership.role,
      company: membership.company,
    });
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify PIN" },
      { status: 500 }
    );
  }
}

// Remove PIN from a member
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const membershipId = parseInt(searchParams.get('membershipId') || '0');
    const companyId = parseInt(searchParams.get('companyId') || '0');

    if (!membershipId || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has permission to manage team
    const canManage = await checkPermission(session.id, companyId, "manage:team");
    if (!canManage) {
      return NextResponse.json({ error: "No permission to manage team" }, { status: 403 });
    }

    // Remove PIN
    await prisma.membership.update({
      where: { id: membershipId },
      data: { 
        pin: null,
        pinHash: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PIN removal error:", error);
    return NextResponse.json(
      { error: "Failed to remove PIN" },
      { status: 500 }
    );
  }
}

