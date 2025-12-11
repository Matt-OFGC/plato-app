import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";
import { generateCompanySlug } from "@/lib/company-defaults";
import { auditLog } from "@/lib/audit-log";

/**
 * Import company data from migration file
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
    const { migrationData, targetCompanyId, importMode = "merge" } = body;

    if (!migrationData) {
      return NextResponse.json(
        { error: "Migration data is required" },
        { status: 400 }
      );
    }

    // Validate migration data structure
    if (!migrationData.version || !migrationData.data) {
      return NextResponse.json(
        { error: "Invalid migration data format" },
        { status: 400 }
      );
    }

    let companyId = targetCompanyId;

    // If no target company, create new one
    if (!companyId) {
      if (!migrationData.data.company?.name) {
        return NextResponse.json(
          { error: "Company name is required to create new company" },
          { status: 400 }
        );
      }

      const slug = await generateCompanySlug(migrationData.data.company.name);
      
      const newCompany = await prisma.company.create({
        data: {
          name: migrationData.data.company.name,
          slug,
          businessType: migrationData.data.company.businessType || null,
          country: migrationData.data.company.country || "United Kingdom",
          phone: migrationData.data.company.phone || null,
          email: migrationData.data.company.email || null,
          website: migrationData.data.company.website || null,
          address: migrationData.data.company.address || null,
          city: migrationData.data.company.city || null,
          postcode: migrationData.data.company.postcode || null,
          logoUrl: migrationData.data.company.logoUrl || null,
          profileBio: migrationData.data.company.profileBio || null,
        },
      });

      // Create membership for user
      await prisma.membership.create({
        data: {
          userId: session.id,
          companyId: newCompany.id,
          role: "OWNER",
          isActive: true,
        },
      });

      companyId = newCompany.id;

      await auditLog.companyCreated(session.id, companyId, newCompany.name);
    } else {
      // Verify user has permission
      const canManage = await checkPermission(session.id, companyId, "settings:edit");
      if (!canManage) {
        return NextResponse.json(
          { error: "No permission to import data to this company" },
          { status: 403 }
        );
      }
    }

    // Import data in transaction
    const importResult = await prisma.$transaction(async (tx) => {
      const stats = {
        recipes: 0,
        ingredients: 0,
        suppliers: 0,
        categories: 0,
        collections: 0,
      };

      // Import ingredients first (recipes depend on them)
      if (migrationData.data.ingredients) {
        for (const ingData of migrationData.data.ingredients) {
          if (importMode === "merge") {
            // Check if ingredient exists
            const existing = await tx.ingredient.findUnique({
              where: {
                name_companyId: {
                  name: ingData.name,
                  companyId,
                },
              },
            });

            if (!existing) {
              await tx.ingredient.create({
                data: {
                  name: ingData.name,
                  supplier: ingData.supplier || null,
                  packQuantity: ingData.packQuantity ? parseFloat(ingData.packQuantity) : null,
                  packUnit: ingData.packUnit || null,
                  packPrice: ingData.packPrice ? parseFloat(ingData.packPrice) : null,
                  currency: ingData.currency || "GBP",
                  densityGPerMl: ingData.densityGPerMl ? parseFloat(ingData.densityGPerMl) : null,
                  notes: ingData.notes || null,
                  allergens: ingData.allergens || null,
                  companyId,
                },
              });
              stats.ingredients++;
            }
          } else {
            // Replace mode - create new
            await tx.ingredient.create({
              data: {
                name: ingData.name,
                supplier: ingData.supplier || null,
                packQuantity: ingData.packQuantity ? parseFloat(ingData.packQuantity) : null,
                packUnit: ingData.packUnit || null,
                packPrice: ingData.packPrice ? parseFloat(ingData.packPrice) : null,
                currency: ingData.currency || "GBP",
                densityGPerMl: ingData.densityGPerMl ? parseFloat(ingData.densityGPerMl) : null,
                notes: ingData.notes || null,
                allergens: ingData.allergens || null,
                companyId,
              },
            });
            stats.ingredients++;
          }
        }
      }

      // Import recipes
      if (migrationData.data.recipes) {
        for (const recipeData of migrationData.data.recipes) {
          if (importMode === "merge") {
            const existing = await tx.recipe.findUnique({
              where: {
                name_companyId: {
                  name: recipeData.name,
                  companyId,
                },
              },
            });

            if (!existing) {
              await tx.recipe.create({
                data: {
                  name: recipeData.name,
                  yieldQuantity: recipeData.yieldQuantity ? parseFloat(recipeData.yieldQuantity) : null,
                  yieldUnit: recipeData.yieldUnit || null,
                  description: recipeData.description || null,
                  method: recipeData.method || null,
                  imageUrl: recipeData.imageUrl || null,
                  categoryId: recipeData.categoryId || null,
                  shelfLifeId: recipeData.shelfLifeId || null,
                  storageId: recipeData.storageId || null,
                  bakeTemp: recipeData.bakeTemp || null,
                  bakeTime: recipeData.bakeTime || null,
                  sellingPrice: recipeData.sellingPrice ? parseFloat(recipeData.sellingPrice) : null,
                  wholesalePrice: recipeData.wholesalePrice ? parseFloat(recipeData.wholesalePrice) : null,
                  companyId,
                },
              });
              stats.recipes++;
            }
          } else {
            await tx.recipe.create({
              data: {
                name: recipeData.name,
                yieldQuantity: recipeData.yieldQuantity ? parseFloat(recipeData.yieldQuantity) : null,
                yieldUnit: recipeData.yieldUnit || null,
                description: recipeData.description || null,
                method: recipeData.method || null,
                imageUrl: recipeData.imageUrl || null,
                categoryId: recipeData.categoryId || null,
                shelfLifeId: recipeData.shelfLifeId || null,
                storageId: recipeData.storageId || null,
                bakeTemp: recipeData.bakeTemp || null,
                bakeTime: recipeData.bakeTime || null,
                sellingPrice: recipeData.sellingPrice ? parseFloat(recipeData.sellingPrice) : null,
                wholesalePrice: recipeData.wholesalePrice ? parseFloat(recipeData.wholesalePrice) : null,
                companyId,
              },
            });
            stats.recipes++;
          }
        }
      }

      // Import suppliers
      if (migrationData.data.suppliers) {
        for (const supplierData of migrationData.data.suppliers) {
          if (importMode === "merge") {
            const existing = await tx.supplier.findFirst({
              where: {
                companyId,
                name: supplierData.name,
              },
            });

            if (!existing) {
              await tx.supplier.create({
                data: {
                  name: supplierData.name,
                  email: supplierData.email || null,
                  phone: supplierData.phone || null,
                  website: supplierData.website || null,
                  companyId,
                },
              });
              stats.suppliers++;
            }
          } else {
            await tx.supplier.create({
              data: {
                name: supplierData.name,
                email: supplierData.email || null,
                phone: supplierData.phone || null,
                website: supplierData.website || null,
                companyId,
              },
            });
            stats.suppliers++;
          }
        }
      }

      return { companyId, stats };
    });

    logger.info(`Company data imported`, {
      companyId: importResult.companyId,
      userId: session.id,
      importMode,
      stats: importResult.stats,
    }, "Companies");

    return NextResponse.json({
      success: true,
      companyId: importResult.companyId,
      stats: importResult.stats,
      message: `Successfully imported ${Object.values(importResult.stats).reduce((a, b) => a + b, 0)} items`,
    });
  } catch (error) {
    logger.error("Error importing company data", error, "Companies");
    return NextResponse.json(
      { error: "Failed to import company data" },
      { status: 500 }
    );
  }
}
