import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";

/**
 * Get company onboarding checklist status
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

    // Get company data to check completion status
    const [company, recipes, ingredients, memberships] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          logoUrl: true,
          businessType: true,
          phone: true,
          email: true,
          address: true,
        },
      }),
      prisma.recipe.findMany({
        where: { companyId },
        take: 1,
        select: { id: true },
      }),
      prisma.ingredient.findMany({
        where: { companyId },
        take: 1,
        select: { id: true },
      }),
      prisma.membership.findMany({
        where: { companyId, isActive: true },
        select: { id: true },
      }),
    ]);

    const items = [
      {
        id: "profile",
        label: "Complete Company Profile",
        description: "Add your business details, logo, and contact information",
        completed: !!(company?.name && company?.businessType && (company?.phone || company?.email)),
        href: "/dashboard/business",
      },
      {
        id: "ingredients",
        label: "Add Your First Ingredient",
        description: "Start building your ingredient library",
        completed: ingredients.length > 0,
        href: "/dashboard/ingredients",
      },
      {
        id: "recipes",
        label: "Create Your First Recipe",
        description: "Add a recipe to get started",
        completed: recipes.length > 0,
        href: "/dashboard/recipes",
      },
      {
        id: "team",
        label: "Invite Team Members",
        description: "Add your team to collaborate",
        completed: memberships.length > 1,
        href: "/dashboard/team",
      },
      {
        id: "settings",
        label: "Configure Settings",
        description: "Set up preferences and defaults",
        completed: false, // Would need to check user preferences
        href: "/dashboard/account/preferences",
      },
    ];

    return NextResponse.json({
      success: true,
      items,
      completedCount: items.filter(item => item.completed).length,
      totalCount: items.length,
    });
  } catch (error) {
    logger.error("Error fetching onboarding status", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}
