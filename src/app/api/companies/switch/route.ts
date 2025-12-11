import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { clearUserCache } from "@/lib/current";
import { hasCompanyAccess } from "@/lib/current";

/**
 * Switch to a different company (set as primary)
 * This updates the session/context to use a different company
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Clear user cache to force refresh with new company
    await clearUserCache(session.id);

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        businessType: true,
        country: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    logger.info(`User ${session.id} switched to company ${companyId}`, {
      userId: session.id,
      companyId,
      companyName: company.name,
    }, "Companies");

    return NextResponse.json({
      success: true,
      company,
      message: `Switched to ${company.name}`,
    });
  } catch (error) {
    logger.error("Error switching company", error, "Companies");
    return NextResponse.json(
      { error: "Failed to switch company" },
      { status: 500 }
    );
  }
}
