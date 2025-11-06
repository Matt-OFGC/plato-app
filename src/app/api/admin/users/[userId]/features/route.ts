import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { FeatureModuleName } from "@/lib/features";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { moduleName, action } = body; // action: "grant" | "revoke" | "upgrade-trial"

    if (!moduleName || !["recipes", "production", "make", "teams", "safety"].includes(moduleName)) {
      return NextResponse.json(
        { error: "Invalid module name" },
        { status: 400 }
      );
    }

    if (!action || !["grant", "revoke", "upgrade-trial"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'grant', 'revoke', or 'upgrade-trial'" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "grant") {
      // Grant access to module (create or activate)
      const existing = await prisma.featureModule.findUnique({
        where: {
          userId_moduleName: {
            userId,
            moduleName: moduleName as FeatureModuleName,
          },
        },
      });

      if (existing) {
        // Update existing module to active
        await prisma.featureModule.update({
          where: {
            userId_moduleName: {
              userId,
              moduleName: moduleName as FeatureModuleName,
            },
          },
          data: {
            status: "active",
            isTrial: false,
            unlockedAt: new Date(),
          },
        });
      } else {
        // Create new module
        await prisma.featureModule.create({
          data: {
            userId,
            moduleName: moduleName as FeatureModuleName,
            status: "active",
            isTrial: false,
            unlockedAt: new Date(),
          },
        });
      }

      // If it's recipes, remove trial limits
      if (moduleName === "recipes") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            maxIngredients: null,
            maxRecipes: null,
          },
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Access granted to ${moduleName} module` 
      });
    } else if (action === "upgrade-trial") {
      // Upgrade from trial to paid (for recipes)
      const existing = await prisma.featureModule.findUnique({
        where: {
          userId_moduleName: {
            userId,
            moduleName: moduleName as FeatureModuleName,
          },
        },
      });

      if (existing && existing.isTrial) {
        await prisma.featureModule.update({
          where: {
            userId_moduleName: {
              userId,
              moduleName: moduleName as FeatureModuleName,
            },
          },
          data: {
            status: "active",
            isTrial: false,
          },
        });

        // Remove trial limits for recipes
        if (moduleName === "recipes") {
          await prisma.user.update({
            where: { id: userId },
            data: {
              maxIngredients: null,
              maxRecipes: null,
            },
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: `Upgraded ${moduleName} from trial to paid` 
        });
      } else {
        return NextResponse.json(
          { error: "Module is not in trial status" },
          { status: 400 }
        );
      }
    } else if (action === "revoke") {
      // Revoke access (set to canceled)
      const existing = await prisma.featureModule.findUnique({
        where: {
          userId_moduleName: {
            userId,
            moduleName: moduleName as FeatureModuleName,
          },
        },
      });

      if (existing) {
        await prisma.featureModule.update({
          where: {
            userId_moduleName: {
              userId,
              moduleName: moduleName as FeatureModuleName,
            },
          },
          data: {
            status: "canceled",
          },
        });
      }

      // Restore trial limits for recipes if revoked
      if (moduleName === "recipes") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            maxIngredients: 10,
            maxRecipes: 5,
          },
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Access revoked for ${moduleName} module` 
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin feature management error:", error);
    return NextResponse.json(
      { error: "Failed to manage feature access" },
      { status: 500 }
    );
  }
}

// Get user's feature modules
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const modules = await prisma.featureModule.findMany({
      where: { userId },
      orderBy: { moduleName: "asc" },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Admin get features error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature modules" },
      { status: 500 }
    );
  }
}

