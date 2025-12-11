import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Get all companies the user belongs to
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

    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.id,
        isActive: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            businessType: true,
            country: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const companies = memberships.map(m => ({
      id: m.id,
      companyId: m.companyId,
      role: m.role,
      isActive: m.isActive,
      company: m.company,
    }));

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error) {
    logger.error("Error fetching user companies", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
