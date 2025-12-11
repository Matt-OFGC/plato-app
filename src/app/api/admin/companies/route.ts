import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, try to get companies with a simpler query to check what fields exist
    let companies;
    try {
      companies = await prisma.company.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          country: true,
          createdAt: true,
          // Try to include these fields, but they might not exist
          maxSeats: true,
          seatsUsed: true,
          isActive: true,
          _count: {
            select: {
              memberships: true,
              recipes: true,
              ingredients: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (selectError: any) {
      // If select fails, try without the potentially missing fields
      logger.warn("Select query failed, trying without optional fields", { message: selectError.message }, 'Admin/Companies');
      companies = await prisma.company.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          businessType: true,
          country: true,
          createdAt: true,
          _count: {
            select: {
              memberships: true,
              recipes: true,
              ingredients: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Add default values for missing fields
      companies = companies.map(company => ({
        ...company,
        maxSeats: (company as any).maxSeats ?? null,
        seatsUsed: (company as any).seatsUsed ?? company._count.memberships,
        isActive: (company as any).isActive ?? true,
      }));
    }

    logger.info(`[Admin API] Fetched ${companies.length} companies from database`, { count: companies.length }, 'Admin/Companies');
    if (companies.length > 0) {
      logger.debug(`[Admin API] Sample company`, { company: companies[0] }, 'Admin/Companies');
    }

    return NextResponse.json({ companies });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error("Admin companies error", { error, errorMessage, errorStack }, 'Admin/Companies');
    
    return NextResponse.json(
      { 
        error: "Failed to fetch companies",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

