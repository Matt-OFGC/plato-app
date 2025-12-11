import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";
import { checkPermission } from "@/lib/permissions";

/**
 * Export company data for migration
 * Creates a comprehensive export file with all company data
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
    const { companyId, format = "json", includeRelations = true } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has permission
    const canManage = await checkPermission(session.id, companyId, "settings:edit");
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to export company data" },
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
      recipeItems,
      recipeSections,
    ] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
      }),
      prisma.membership.findMany({
        where: { companyId },
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
      }),
      prisma.ingredient.findMany({
        where: { companyId },
      }),
      includeRelations ? prisma.supplier.findMany({
        where: { companyId },
      }) : Promise.resolve([]),
      includeRelations ? prisma.category.findMany({
        where: { companyId },
      }) : Promise.resolve([]),
      includeRelations ? prisma.collection.findMany({
        where: { companyId },
      }) : Promise.resolve([]),
      includeRelations ? prisma.recipeItem.findMany({
        where: {
          recipe: {
            companyId,
          },
        },
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }) : Promise.resolve([]),
      includeRelations ? prisma.recipeSection.findMany({
        where: {
          recipe: {
            companyId,
          },
        },
      }) : Promise.resolve([]),
    ]);

    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      companyId,
      companyName: company?.name,
      data: {
        company: company ? {
          name: company.name,
          businessType: company.businessType,
          country: company.country,
          phone: company.phone,
          email: company.email,
          website: company.website,
          address: company.address,
          city: company.city,
          postcode: company.postcode,
          logoUrl: company.logoUrl,
          profileBio: company.profileBio,
        } : null,
        team: memberships.map(m => ({
          userEmail: m.user.email,
          userName: m.user.name,
          role: m.role,
          isActive: m.isActive,
        })),
        recipes: recipes.map(r => ({
          name: r.name,
          yieldQuantity: r.yieldQuantity?.toString(),
          yieldUnit: r.yieldUnit,
          description: r.description,
          method: r.method,
          imageUrl: r.imageUrl,
          categoryId: r.categoryId,
          shelfLifeId: r.shelfLifeId,
          storageId: r.storageId,
          bakeTemp: r.bakeTemp,
          bakeTime: r.bakeTime,
          sellingPrice: r.sellingPrice?.toString(),
          wholesalePrice: r.wholesalePrice?.toString(),
        })),
        ingredients: ingredients.map(i => ({
          name: i.name,
          supplier: i.supplier,
          packQuantity: i.packQuantity?.toString(),
          packUnit: i.packUnit,
          packPrice: i.packPrice?.toString(),
          currency: i.currency,
          densityGPerMl: i.densityGPerMl?.toString(),
          notes: i.notes,
          allergens: i.allergens,
        })),
        suppliers: includeRelations ? suppliers.map(s => ({
          name: s.name,
          email: s.email,
          phone: s.phone,
          website: s.website,
        })) : [],
        categories: includeRelations ? categories.map(c => ({
          name: c.name,
          description: c.description,
          color: c.color,
        })) : [],
        collections: includeRelations ? collections.map(c => ({
          name: c.name,
          description: c.description,
        })) : [],
        recipeItems: includeRelations ? recipeItems.map(ri => ({
          recipeName: recipes.find(r => r.id === ri.recipeId)?.name,
          ingredientName: ri.ingredient?.name,
          quantity: ri.quantity?.toString(),
          unit: ri.unit,
          note: ri.note,
        })) : [],
        recipeSections: includeRelations ? recipeSections.map(rs => ({
          recipeName: recipes.find(r => r.id === rs.recipeId)?.name,
          title: rs.title,
          description: rs.description,
          method: rs.method,
          order: rs.order,
        })) : [],
      },
    };

    logger.info(`Company data exported for migration`, {
      companyId,
      userId: session.id,
      format,
      dataSize: JSON.stringify(exportData).length,
    }, "Companies");

    if (format === "csv") {
      // Convert to CSV format (simplified)
      return NextResponse.json({
        success: true,
        message: "CSV export format coming soon. Using JSON for now.",
        data: exportData,
      });
    }

    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `${company?.name || "company"}-migration-${new Date().toISOString().split('T')[0]}.json`,
    });
  } catch (error) {
    logger.error("Error exporting company data for migration", error, "Companies");
    return NextResponse.json(
      { error: "Failed to export company data" },
      { status: 500 }
    );
  }
}
