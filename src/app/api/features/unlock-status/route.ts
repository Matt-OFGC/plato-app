import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getUnlockStatus, checkRecipesLimits } from "@/lib/features";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unlockStatus = await getUnlockStatus(session.id);
    const recipesLimits = await checkRecipesLimits(session.id);

    return NextResponse.json({
      unlockStatus,
      recipesLimits,
    });
  } catch (error) {
    console.error("Get unlock status error:", error);
    return NextResponse.json(
      { error: "Failed to get unlock status" },
      { status: 500 }
    );
  }
}

