import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      checks: {
        database: await checkDatabase(),
        environment: checkEnvironment(),
      },
    };

    const allHealthy = checks.checks.database && checks.checks.environment;
    
    return NextResponse.json(checks, { 
      status: allHealthy ? 200 : 503 
    });
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

function checkEnvironment(): boolean {
  try {
    return !!(process.env.DATABASE_URL);
  } catch (error) {
    console.error("Environment check failed:", error);
    return false;
  }
}
