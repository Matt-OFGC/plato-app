import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getUnlockStatus } from "@/lib/features";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unlockStatus = await getUnlockStatus(session.id);

    return NextResponse.json(unlockStatus);
  } catch (error) {
    console.error("Check features error:", error);
    return NextResponse.json(
      { error: "Failed to check features" },
      { status: 500 }
    );
  }
}

