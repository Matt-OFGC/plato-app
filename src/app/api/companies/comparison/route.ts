import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";

/**
 * Compare multiple companies
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
    const { companyIds } = body;

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length < 2) {
      return NextResponse.json(
        { error: "At least 2 company IDs are required for comparison" },
        { status: 400 }
      );
    }

    // Verify user has access to all companies
    for (const companyId of companyIds) {
      const hasAccess = await hasCompanyAccess(session.id, companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: `No access to company ${companyId}` },
          { status: 403 }
        );
      }
    }

    // Fetch all companies data
    const companies = await Promise.all(
      companyIds.map(async (companyId: number) => {
        const [company, stats] = await Promise.all([
          prisma.company.findUnique({
            where: { id: companyId },
            select: {
              id: true,
              name: true,
              businessType: true,
              country: true,
              createdAt: true,
            },
          }),
          Promise.all([
            prisma.recipe.count({ where: { companyId } }),
            prisma.ingredient.count({ where: { companyId } }),
            prisma.membership.count({ where: { companyId, isActive: true } }),
          ]),
        ]);

        return {
          id: company?.id,
          name: company?.name,
          businessType: company?.businessType,
          country: company?.country,
          createdAt: company?.createdAt,
          stats: {
            recipes: stats[0],
            ingredients: stats[1],
            members: stats[2],
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      comparison: {
        companies,
        metrics: {
          totalRecipes: companies.reduce((sum, c) => sum + c.stats.recipes, 0),
          totalIngredients: companies.reduce((sum, c) => sum + c.stats.ingredients, 0),
          totalMembers: companies.reduce((sum, c) => sum + c.stats.members, 0),
        },
      },
    });
  } catch (error) {
    logger.error("Error comparing companies", error, "Companies");
    return NextResponse.json(
      { error: "Failed to compare companies" },
      { status: 500 }
    );
  }
}
