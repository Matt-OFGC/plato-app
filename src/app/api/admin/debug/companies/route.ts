import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// Debug endpoint to check what's in the database
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get raw count
    const totalCount = await prisma.company.count();
    
    // Get all companies without any filters
    const allCompanies = await prisma.company.findMany({
      take: 10, // Limit to first 10 for debugging
    });

    // Get companies with the same query as the main endpoint
    const companiesWithSelect = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        country: true,
        createdAt: true,
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
      take: 10,
    });

    return NextResponse.json({
      debug: true,
      totalCount,
      allCompaniesSample: allCompanies.slice(0, 3),
      companiesWithSelectSample: companiesWithSelect.slice(0, 3),
      companiesWithSelectCount: companiesWithSelect.length,
    });
  } catch (error) {
    console.error("Debug companies error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch debug info",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}






