import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { verifyTotpDevice, setPrimaryMfaDevice } from "@/lib/mfa/totp";

// Verify and activate TOTP device
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, token, setAsPrimary } = body;

    if (!deviceId || !token) {
      return NextResponse.json(
        { error: "Device ID and token are required" },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = await verifyTotpDevice(deviceId, token);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Set as primary if requested
    if (setAsPrimary) {
      await setPrimaryMfaDevice(session.id, deviceId);
    }

    return NextResponse.json({
      success: true,
      message: "TOTP device verified and activated",
    });
  } catch (error) {
    console.error("TOTP verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify TOTP device" },
      { status: 500 }
    );
  }
}

