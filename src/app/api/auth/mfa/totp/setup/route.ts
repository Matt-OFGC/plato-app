import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { generateTotpSecret, createTotpDevice } from "@/lib/mfa/totp";

// Initiate TOTP setup
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate secret
    const secret = generateTotpSecret();

    // Create device and get QR code
    const { id, qrCode } = await createTotpDevice(session.id, secret);

    return NextResponse.json({
      deviceId: id,
      secret, // Only return during setup
      qrCode,
    });
  } catch (error) {
    console.error("TOTP setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup TOTP" },
      { status: 500 }
    );
  }
}

