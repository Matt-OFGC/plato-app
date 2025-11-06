import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
// Temporarily disabled to fix build error
// import { getUnlockStatus, checkRecipesLimits } from "@/lib/features";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Temporarily disabled to fix build error
    // const unlockStatus = await getUnlockStatus(session.id);
    // const recipesLimits = await checkRecipesLimits(session.id);
    const unlockStatus = {
      recipes: { unlocked: true, isTrial: true, status: "trialing" },
      production: { unlocked: false, isTrial: false, status: null },
      make: { unlocked: false, isTrial: false, status: null },
      teams: { unlocked: false, isTrial: false, status: null },
      safety: { unlocked: false, isTrial: false, status: null },
    };
    const recipesLimits = {
      withinLimit: true,
      withinIngredientsLimit: true,
      withinRecipesLimit: true,
      ingredientsUsed: 0,
      ingredientsLimit: 10,
      recipesUsed: 0,
      recipesLimit: 5,
    };

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

