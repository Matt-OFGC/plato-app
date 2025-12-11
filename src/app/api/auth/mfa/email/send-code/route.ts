import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { sendEmailMfaCode } from "@/lib/mfa/email";
import { logger } from "@/lib/logger";

// Send email 2FA code
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Send code
    await sendEmailMfaCode(session.id);

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    logger.error("Send email MFA code error", error, "Auth/MFA/Email");
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}

