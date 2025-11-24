import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getUnlockStatus, checkRecipesLimits, UnlockStatus } from "@/lib/features";
import { prisma } from "@/lib/prisma";

// Ensure this route is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      console.error('[Unlock Status] No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        isActive: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
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

    console.log('[Unlock Status] User subscription:', {
      userId: session.id,
      email: session.email,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
    });
    
    const unlockStatus: UnlockStatus = await getUnlockStatus(session.id);
    const recipesLimits = await checkRecipesLimits(session.id);
    
    console.log('[Unlock Status] Final unlock status result:', JSON.stringify(unlockStatus, null, 2));
    console.log('[Unlock Status] Recipes limits:', recipesLimits);
    console.log('[Unlock Status] Module unlock states:', {
      recipes: unlockStatus.recipes?.unlocked,
      production: unlockStatus.production?.unlocked,
      make: unlockStatus.make?.unlocked,
      teams: unlockStatus.teams?.unlocked,
      safety: unlockStatus.safety?.unlocked,
    });

    const response = NextResponse.json({
      unlockStatus,
      recipesLimits,
      debug: {
        userId: session.id,
        userEmail: session.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        timestamp: new Date().toISOString(),
      },
    });
    
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Timestamp', Date.now().toString());
    
    return response;
  } catch (error) {
    console.error("Get unlock status error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details
    console.error("Full error details:", {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });
    
    // If it's a Prisma error about missing fields, try to return unlocked status anyway
    if (errorMessage.includes("maxIngredients") || errorMessage.includes("maxRecipes") || errorMessage.includes("ingredientCount") || errorMessage.includes("recipeCount")) {
      console.warn("[Unlock Status] Prisma field error detected - returning unlocked status as fallback");
      return NextResponse.json({
        unlockStatus: {
          recipes: { unlocked: true, isTrial: false, status: "active" },
          production: { unlocked: true, isTrial: false, status: "active" },
          make: { unlocked: true, isTrial: false, status: "active" },
          teams: { unlocked: true, isTrial: false, status: "active" },
          safety: { unlocked: true, isTrial: false, status: "active" },
        },
        recipesLimits: {
          withinLimit: true,
          withinIngredientsLimit: true,
          withinRecipesLimit: true,
          ingredientsUsed: 0,
          ingredientsLimit: Infinity,
          recipesUsed: 0,
          recipesLimit: Infinity,
        },
        debug: {
          userId: session?.id,
          userEmail: session?.email,
          error: "Field error detected - using fallback",
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to get unlock status", 
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}
