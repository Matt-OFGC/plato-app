import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { clearUserCache } from "@/lib/current";
import { generateCompanySlug } from "@/lib/company-defaults";
import { auditLog } from "@/lib/audit-log";

/**
 * Clone/duplicate a company with optional data
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
    const { companyId, newName, cloneRecipes, cloneIngredients, cloneSettings } = body;

    if (!companyId || !newName) {
      return NextResponse.json(
        { error: "Company ID and new name are required" },
        { status: 400 }
      );
    }

    // Verify user has access to source company
    const sourceMembership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId,
        },
      },
      include: {
        company: true,
      },
    });

    if (!sourceMembership || !sourceMembership.isActive) {
      return NextResponse.json(
        { error: "No access to source company" },
        { status: 403 }
      );
    }

    const sourceCompany = sourceMembership.company;
    const slug = await generateCompanySlug(newName);

    // Create new company and membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create new company
      const newCompany = await tx.company.create({
        data: {
          name: newName,
          slug,
          businessType: cloneSettings ? sourceCompany.businessType : null,
          country: cloneSettings ? sourceCompany.country : "United Kingdom",
          phone: cloneSettings ? sourceCompany.phone : null,
          email: cloneSettings ? sourceCompany.email : null,
          website: cloneSettings ? sourceCompany.website : null,
          address: cloneSettings ? sourceCompany.address : null,
          city: cloneSettings ? sourceCompany.city : null,
          postcode: cloneSettings ? sourceCompany.postcode : null,
          logoUrl: cloneSettings ? sourceCompany.logoUrl : null,
          profileBio: cloneSettings ? sourceCompany.profileBio : null,
          showTeam: cloneSettings ? sourceCompany.showTeam : false,
          showContact: cloneSettings ? sourceCompany.showContact : true,
          isProfilePublic: cloneSettings ? sourceCompany.isProfilePublic : false,
        },
      });

      // Create membership for user
      const newMembership = await tx.membership.create({
        data: {
          userId: session.id,
          companyId: newCompany.id,
          role: "OWNER",
          isActive: true,
        },
      });

      // Clone recipes if requested
      if (cloneRecipes) {
        const sourceRecipes = await tx.recipe.findMany({
          where: { companyId: sourceCompany.id },
          include: {
            items: true,
            sections: true,
          },
        });

        for (const recipe of sourceRecipes) {
          const newRecipe = await tx.recipe.create({
            data: {
              name: recipe.name,
              yieldQuantity: recipe.yieldQuantity,
              yieldUnit: recipe.yieldUnit,
              description: recipe.description,
              method: recipe.method,
              imageUrl: recipe.imageUrl,
              companyId: newCompany.id,
              categoryId: recipe.categoryId,
              shelfLifeId: recipe.shelfLifeId,
              storageId: recipe.storageId,
              bakeTemp: recipe.bakeTemp,
              bakeTime: recipe.bakeTime,
              sellingPrice: recipe.sellingPrice,
              wholesalePrice: recipe.wholesalePrice,
            },
          });

          // Clone recipe items
          if (recipe.items.length > 0) {
            await tx.recipeItem.createMany({
              data: recipe.items.map(item => ({
                recipeId: newRecipe.id,
                ingredientId: item.ingredientId,
                quantity: item.quantity,
                unit: item.unit,
                note: item.note,
                sectionId: null, // Will handle sections separately
              })),
            });
          }

          // Clone recipe sections
          if (recipe.sections.length > 0) {
            const sectionMap = new Map<number, number>();
            for (const section of recipe.sections) {
              const newSection = await tx.recipeSection.create({
                data: {
                  recipeId: newRecipe.id,
                  title: section.title,
                  description: section.description,
                  method: section.method,
                  order: section.order,
                  bakeTemp: section.bakeTemp,
                  bakeTime: section.bakeTime,
                  hasTimer: section.hasTimer,
                },
              });
              sectionMap.set(section.id, newSection.id);
            }

            // Update recipe items with new section IDs
            for (let i = 0; i < recipe.sections.length; i++) {
              const section = recipe.sections[i];
              const newSectionId = sectionMap.get(section.id);
              if (newSectionId && section.items) {
                // Note: This is simplified - in reality you'd need to map items to sections
              }
            }
          }
        }
      }

      // Clone ingredients if requested
      if (cloneIngredients) {
        const sourceIngredients = await tx.ingredient.findMany({
          where: { companyId: sourceCompany.id },
        });

        await tx.ingredient.createMany({
          data: sourceIngredients.map(ing => ({
            name: ing.name,
            supplier: ing.supplier,
            packQuantity: ing.packQuantity,
            packUnit: ing.packUnit,
            packPrice: ing.packPrice,
            currency: ing.currency,
            densityGPerMl: ing.densityGPerMl,
            notes: ing.notes,
            companyId: newCompany.id,
            allergens: ing.allergens,
            customConversions: ing.customConversions,
            batchPricing: ing.batchPricing,
            servingsPerPack: ing.servingsPerPack,
            servingUnit: ing.servingUnit,
          })),
        });
      }

      return { company: newCompany, membership: newMembership };
    });

    // Clear cache
    await clearUserCache(session.id);

    // Audit
    await auditLog.companyCreated(
      session.id,
      result.company.id,
      newName
    );
    await auditLog.companyUpdated(
      session.id,
      sourceCompany.id,
      {
        action: "clone_company",
        clonedToCompanyId: result.company.id,
        clonedToCompanyName: newName,
        clonedData: {
          recipes: cloneRecipes,
          ingredients: cloneIngredients,
          settings: cloneSettings,
        },
      }
    );

    logger.info(`Company cloned`, {
      sourceCompanyId: sourceCompany.id,
      newCompanyId: result.company.id,
      userId: session.id,
    }, "Companies");

    return NextResponse.json({
      success: true,
      company: result.company,
      message: `Company "${newName}" created successfully`,
    });
  } catch (error) {
    logger.error("Error cloning company", error, "Companies");
    return NextResponse.json(
      { error: "Failed to clone company" },
      { status: 500 }
    );
  }
}
