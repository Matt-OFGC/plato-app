import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";

/**
 * Get collaboration projects (shared recipes/ingredients between companies)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '0');

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await hasCompanyAccess(session.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Get shared/collected recipes (if collection sharing exists)
    // For now, return empty array as collaboration features would need additional schema
    const projects: any[] = [];

    return NextResponse.json({
      success: true,
      projects,
      message: "Collaboration projects feature coming soon",
    });
  } catch (error) {
    logger.error("Error fetching collaboration projects", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch collaboration projects" },
      { status: 500 }
    );
  }
}
