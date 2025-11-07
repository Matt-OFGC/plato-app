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

    const response = NextResponse.json({
      unlockStatus,
      recipesLimits,
    });
    
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Get unlock status error:", error);
    return NextResponse.json(
      { error: "Failed to get unlock status" },
      { status: 500 }
    );
  }
}

