import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// Get company details with all team members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId: companyIdParam } = await params;
    const companyId = parseInt(companyIdParam);
    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    // Try to fetch company with memberships
    let company;
    try {
      company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  isActive: true,
                  isAdmin: true,
                  createdAt: true,
                  lastLoginAt: true,
                  subscriptionTier: true,
                  subscriptionStatus: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              recipes: true,
              ingredients: true,
              memberships: true,
            },
          },
        },
      });
    } catch (queryError: any) {
      console.error("Company query error:", queryError);
      // Try without subscription relation if it fails
      company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  isActive: true,
                  isAdmin: true,
                  createdAt: true,
                  lastLoginAt: true,
                  subscriptionTier: true,
                  subscriptionStatus: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              recipes: true,
              ingredients: true,
              memberships: true,
            },
          },
        },
      });
    }

    if (!company) {
      console.error(`[Admin API] Company ${companyId} not found`);
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    console.log(`[Admin API] Fetched company ${companyId} with ${company.memberships?.length || 0} members`);
    return NextResponse.json({ company });
  } catch (error) {
    console.error("Admin company details error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, companyId });
    
    return NextResponse.json(
      { 
        error: "Failed to fetch company details",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Update company
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId: companyIdParam } = await params;
    const companyId = parseInt(companyIdParam);
    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, businessType, country, phone, maxSeats, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (businessType !== undefined) updateData.businessType = businessType;
    if (country !== undefined) updateData.country = country;
    if (phone !== undefined) updateData.phone = phone;
    if (maxSeats !== undefined) updateData.maxSeats = maxSeats;
    if (isActive !== undefined) updateData.isActive = isActive;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("Admin company update error:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

