import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { setPrimaryMfaDevice } from "@/lib/mfa/totp";

// Get user's MFA devices
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devices = await prisma.mfaDevice.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        type: true,
        name: true,
        isVerified: true,
        isPrimary: true,
        createdAt: true,
        // Don't expose secrets
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error("Get MFA devices error:", error);
    return NextResponse.json(
      { error: "Failed to get MFA devices" },
      { status: 500 }
    );
  }
}

// Delete MFA device
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    // Verify device belongs to user
    const device = await prisma.mfaDevice.findFirst({
      where: {
        id: deviceId,
        userId: session.id,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    // Don't allow deleting the last verified device if it's primary
    if (device.isPrimary) {
      const otherDevices = await prisma.mfaDevice.count({
        where: {
          userId: session.id,
          isVerified: true,
          id: { not: deviceId },
        },
      });

      if (otherDevices === 0) {
        return NextResponse.json(
          { error: "Cannot delete the last MFA device" },
          { status: 400 }
        );
      }
    }

    await prisma.mfaDevice.delete({
      where: { id: deviceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete MFA device error:", error);
    return NextResponse.json(
      { error: "Failed to delete MFA device" },
      { status: 500 }
    );
  }
}

// Set primary MFA device
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    await setPrimaryMfaDevice(session.id, deviceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set primary MFA device error:", error);
    return NextResponse.json(
      { error: "Failed to set primary MFA device" },
      { status: 500 }
    );
  }
}

