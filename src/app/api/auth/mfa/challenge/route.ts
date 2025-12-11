import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { challengeMfa } from "@/lib/mfa/totp";
import { logger } from "@/lib/logger";

// Challenge user with MFA during login
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "MFA token is required" },
        { status: 400 }
      );
    }

    // Verify MFA token
    const isValid = await challengeMfa(session.id, token);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid MFA code" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "MFA verified successfully",
    });
  } catch (error) {
    logger.error("MFA challenge error", error, "Auth/MFA/Challenge");
    return NextResponse.json(
      { error: "Failed to verify MFA" },
      { status: 500 }
    );
  }
}

