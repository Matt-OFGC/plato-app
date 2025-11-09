import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getUnlockStatus, checkRecipesLimits } from "@/lib/features";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      console.error('[Unlock Status] No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enhanced logging: Log user ID, email, and verify user exists
    console.log('[Unlock Status] Checking for user:', {
      id: session.id,
      email: session.email,
      isAdmin: session.isAdmin
    });
    
    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    if (!user) {
      console.error('[Unlock Status] User not found in database:', session.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      console.error('[Unlock Status] User is inactive:', session.id);
      return NextResponse.json({ error: "User account is inactive" }, { status: 403 });
    }

    // Log FeatureModule records directly from database for debugging
    const featureModules = await prisma.featureModule.findMany({
      where: { userId: session.id },
    });
    console.log('[Unlock Status] FeatureModule records from DB:', featureModules.map(m => ({
      moduleName: m.moduleName,
      status: m.status,
      isTrial: m.isTrial,
      unlockedAt: m.unlockedAt,
    })));
    
    try {
      const unlockStatus = await getUnlockStatus(session.id);
      const recipesLimits = await checkRecipesLimits(session.id);
      
      console.log('[Unlock Status] Final unlock status result:', JSON.stringify(unlockStatus, null, 2));
      console.log('[Unlock Status] Recipes limits:', recipesLimits);

    const response = NextResponse.json({
      unlockStatus,
      recipesLimits,
      debug: {
        userId: session.id,
        userEmail: session.email,
        featureModulesCount: featureModules.length,
      },
    });
    
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Timestamp', Date.now().toString());
    
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

