import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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
      console.warn("Select query failed, trying without optional fields:", selectError.message);
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

    console.log(`[Admin API] Fetched ${companies.length} companies from database`);
    if (companies.length > 0) {
      console.log(`[Admin API] Sample company:`, companies[0]);
    }

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Admin companies error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: "Failed to fetch companies",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

