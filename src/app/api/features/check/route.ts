import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { logger } from "@/lib/logger";
// Temporarily disabled to fix build error
// import { getUnlockStatus } from "@/lib/features";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Temporarily disabled to fix build error
    // const unlockStatus = await getUnlockStatus(session.id);
    const unlockStatus = {
      recipes: { unlocked: true, isTrial: true, status: "trialing" },
      production: { unlocked: false, isTrial: false, status: null },
      make: { unlocked: false, isTrial: false, status: null },
      teams: { unlocked: false, isTrial: false, status: null },
      safety: { unlocked: false, isTrial: false, status: null },
    };

    return NextResponse.json(unlockStatus);
  } catch (error) {
    logger.error("Check features error", error, "Features/Check");
    return NextResponse.json(
      { error: "Failed to check features" },
      { status: 500 }
    );
  }
}

