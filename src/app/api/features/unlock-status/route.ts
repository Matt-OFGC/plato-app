import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getUnlockStatus, checkRecipesLimits } from "@/lib/features";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Debug: Log user ID and check if FeatureModule table exists
    console.log('Unlock status check for user:', session.id);
    
    try {
      const unlockStatus = await getUnlockStatus(session.id);
      const recipesLimits = await checkRecipesLimits(session.id);
      
      console.log('Unlock status result:', JSON.stringify(unlockStatus, null, 2));

    const response = NextResponse.json({
      unlockStatus,
      recipesLimits,
    });
    
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
      return response;
    } catch (dbError: any) {
      console.error("Database error in unlock status:", dbError);
      // If FeatureModule table doesn't exist, return default locked status
      if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
        console.error("FeatureModule table does not exist in production database!");
        return NextResponse.json({
          unlockStatus: {
            recipes: { unlocked: true, isTrial: true, status: "trialing" },
            production: { unlocked: false, isTrial: false, status: null },
            make: { unlocked: false, isTrial: false, status: null },
            teams: { unlocked: false, isTrial: false, status: null },
            safety: { unlocked: false, isTrial: false, status: null },
          },
          recipesLimits: {
            withinLimit: true,
            withinIngredientsLimit: true,
            withinRecipesLimit: true,
            ingredientsUsed: 0,
            ingredientsLimit: 10,
            recipesUsed: 0,
            recipesLimit: 5,
          },
          error: "FeatureModule table not found - database migration needed",
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Get unlock status error:", error);
    return NextResponse.json(
      { error: "Failed to get unlock status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

