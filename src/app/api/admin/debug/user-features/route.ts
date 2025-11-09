import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getUnlockStatus } from "@/lib/features";

/**
 * Diagnostic endpoint to compare admin-granted feature access vs what frontend sees
 * GET /api/admin/debug/user-features?userId=123 or ?email=user@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const emailParam = searchParams.get("email");

    if (!userIdParam && !emailParam) {
      return NextResponse.json(
        { error: "Either userId or email parameter is required" },
        { status: 400 }
      );
    }

    // Find user
    let user;
    if (userIdParam) {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userIdParam) },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          subscriptionTier: true,
          subscriptionStatus: true,
        },
      });
    } else if (emailParam) {
      user = await prisma.user.findUnique({
        where: { email: emailParam },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          subscriptionTier: true,
          subscriptionStatus: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get FeatureModule records directly from database
    const featureModules = await prisma.featureModule.findMany({
      where: { userId: user.id },
      orderBy: { moduleName: "asc" },
    });

    // Get unlock status using the same function frontend uses
    const unlockStatus = await getUnlockStatus(user.id);

    // Compare database records vs unlock status
    const comparison = {
      recipes: {
        dbRecord: featureModules.find(m => m.moduleName === "recipes"),
        unlockStatus: unlockStatus.recipes,
        matches: featureModules.find(m => m.moduleName === "recipes")?.status === "active" || featureModules.find(m => m.moduleName === "recipes")?.status === "trialing" ? unlockStatus.recipes.unlocked : !unlockStatus.recipes.unlocked,
      },
      production: {
        dbRecord: featureModules.find(m => m.moduleName === "production"),
        unlockStatus: unlockStatus.production,
        matches: featureModules.find(m => m.moduleName === "production")?.status === "active" || featureModules.find(m => m.moduleName === "production")?.status === "trialing" ? unlockStatus.production.unlocked : !unlockStatus.production.unlocked,
      },
      make: {
        dbRecord: featureModules.find(m => m.moduleName === "make"),
        unlockStatus: unlockStatus.make,
        matches: featureModules.find(m => m.moduleName === "make")?.status === "active" || featureModules.find(m => m.moduleName === "make")?.status === "trialing" ? unlockStatus.make.unlocked : !unlockStatus.make.unlocked,
      },
      teams: {
        dbRecord: featureModules.find(m => m.moduleName === "teams"),
        unlockStatus: unlockStatus.teams,
        matches: featureModules.find(m => m.moduleName === "teams")?.status === "active" || featureModules.find(m => m.moduleName === "teams")?.status === "trialing" ? unlockStatus.teams.unlocked : !unlockStatus.teams.unlocked,
      },
      safety: {
        dbRecord: featureModules.find(m => m.moduleName === "safety"),
        unlockStatus: unlockStatus.safety,
        matches: featureModules.find(m => m.moduleName === "safety")?.status === "active" || featureModules.find(m => m.moduleName === "safety")?.status === "trialing" ? unlockStatus.safety.unlocked : !unlockStatus.safety.unlocked,
      },
    };

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
      },
      databaseRecords: featureModules.map(m => ({
        moduleName: m.moduleName,
        status: m.status,
        isTrial: m.isTrial,
        unlockedAt: m.unlockedAt,
        updatedAt: m.updatedAt,
      })),
      unlockStatusResponse: unlockStatus,
      comparison,
      summary: {
        totalModulesInDb: featureModules.length,
        unlockedModulesInDb: featureModules.filter(m => m.status === "active" || m.status === "trialing").length,
        unlockedModulesInResponse: Object.values(unlockStatus).filter(m => m.unlocked).length,
        allMatch: Object.values(comparison).every(c => c.matches),
      },
    });
  } catch (error: any) {
    console.error("Diagnostic endpoint error:", error);
    return NextResponse.json(
      {
        error: "Failed to get diagnostic information",
        details: error?.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

