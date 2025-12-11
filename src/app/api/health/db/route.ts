import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    // Test database connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Get basic database stats
    const [userCount, recipeCount, ingredientCount, companyCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.recipe.count().catch(() => 0),
      prisma.ingredient.count().catch(() => 0),
      prisma.company.count().catch(() => 0)
    ]);

    return NextResponse.json({
      status: "healthy",
      database: {
        connected: true,
        provider: "PostgreSQL",
        responseTime: `${responseTime}ms`,
        stats: {
          users: userCount,
          recipes: recipeCount,
          ingredients: ingredientCount,
          companies: companyCount
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + "..."
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("Database health check failed", error, "Health/DB");
    
    return NextResponse.json({
      status: "unhealthy",
      database: {
        connected: false,
        provider: "PostgreSQL",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + "..."
      },
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
