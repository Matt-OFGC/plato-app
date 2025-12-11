import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";

/**
 * Export all company data as JSON
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

    // Verify user has access
    const hasAccess = await hasCompanyAccess(session.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Get all company data
    const [
      company,
      memberships,
      recipes,
      ingredients,
      suppliers,
      categories,
      collections,
    ] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
      }),
      prisma.membership.findMany({
        where: { companyId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.recipe.findMany({
        where: { companyId },
        include: {
          items: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          sections: true,
        },
      }),
      prisma.ingredient.findMany({
        where: { companyId },
      }),
      prisma.supplier.findMany({
        where: { companyId },
      }),
      prisma.category.findMany({
        where: { companyId },
      }),
      prisma.collection.findMany({
        where: { companyId },
        include: {
          RecipeCollection: {
            include: {
              recipe: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      company: {
        id: company?.id,
        name: company?.name,
        businessType: company?.businessType,
        country: company?.country,
        phone: company?.phone,
        email: company?.email,
        website: company?.website,
        address: company?.address,
        city: company?.city,
        postcode: company?.postcode,
      },
      team: memberships.map(m => ({
        email: m.user.email,
        name: m.user.name,
        role: m.role,
      })),
      recipes: recipes.map(r => ({
        name: r.name,
        yieldQuantity: r.yieldQuantity.toString(),
        yieldUnit: r.yieldUnit,
        description: r.description,
        method: r.method,
        ingredients: r.items.map(item => ({
          ingredientName: item.ingredient.name,
          quantity: item.quantity.toString(),
          unit: item.unit,
          note: item.note,
        })),
        sections: r.sections.map(s => ({
          title: s.title,
          description: s.description,
          method: s.method,
          order: s.order,
        })),
      })),
      ingredients: ingredients.map(i => ({
        name: i.name,
        supplier: i.supplier,
        packQuantity: i.packQuantity.toString(),
        packUnit: i.packUnit,
        packPrice: i.packPrice.toString(),
        currency: i.currency,
        allergens: i.allergens,
      })),
      suppliers: suppliers.map(s => ({
        name: s.name,
        email: s.email,
        phone: s.phone,
        website: s.website,
      })),
      categories: categories.map(c => ({
        name: c.name,
        description: c.description,
        color: c.color,
      })),
      collections: collections.map(c => ({
        name: c.name,
        description: c.description,
        recipes: c.RecipeCollection.map(rc => rc.recipe.name),
      })),
    };

    logger.info(`Company data exported`, {
      companyId,
      userId: session.id,
      dataSize: JSON.stringify(exportData).length,
    }, "Companies");

    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `${company?.name || "company"}-export-${new Date().toISOString().split('T')[0]}.json`,
    });
  } catch (error) {
    logger.error("Error exporting company data", error, "Companies");
    return NextResponse.json(
      { error: "Failed to export company data" },
      { status: 500 }
    );
  }
}
