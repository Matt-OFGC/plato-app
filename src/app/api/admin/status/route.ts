import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Test database connection
    let databaseStatus = {
      connected: false,
      provider: "PostgreSQL",
      status: "Unknown",
      lastCheck: new Date().toISOString()
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus.connected = true;
      databaseStatus.status = "Healthy";
    } catch (error) {
      databaseStatus.status = "Error";
      console.error("Database connection test failed:", error);
    }

    // Get basic stats
    let stats = {
      users: 0,
      recipes: 0,
      ingredients: 0
    };

    try {
      const [userCount, recipeCount, ingredientCount] = await Promise.all([
        prisma.user.count(),
        prisma.recipe.count(),
        prisma.ingredient.count()
      ]);

      stats = {
        users: userCount,
        recipes: recipeCount,
        ingredients: ingredientCount
      };
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }

    return NextResponse.json({
      database: databaseStatus,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("System status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system status" },
      { status: 500 }
    );
  }
}
