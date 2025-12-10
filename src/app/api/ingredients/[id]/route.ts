import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";
import { toBase, BaseUnit, Unit } from "@/lib/units";

// GET /api/ingredients/[id] - Get a single ingredient
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const { id } = await params;
    const ingredientId = parseInt(id);

    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { supplierRef: true }
    });

    if (!ingredient || ingredient.companyId !== companyId) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: ingredient.id,
      name: ingredient.name,
      supplier: ingredient.supplier || null,
      supplierId: ingredient.supplierId || null,
      packQuantity: ingredient.packQuantity.toString(),
      packUnit: ingredient.packUnit,
      originalUnit: ingredient.originalUnit || ingredient.packUnit,
      packPrice: ingredient.packPrice.toString(),
      currency: ingredient.currency || "GBP",
      densityGPerMl: ingredient.densityGPerMl?.toString() || null,
      allergens: Array.isArray(ingredient.allergens) ? ingredient.allergens : (typeof ingredient.allergens === 'string' ? JSON.parse(ingredient.allergens || '[]') : []),
      notes: ingredient.notes || null,
      createdAt: ingredient.createdAt.toISOString(),
      updatedAt: ingredient.updatedAt.toISOString(),
      supplierRef: ingredient.supplierRef ? {
        id: ingredient.supplierRef.id,
        name: ingredient.supplierRef.name
      } : null
    });
  } catch (error) {
    logger.error("Error fetching ingredient", error, "Ingredients");
    return NextResponse.json(
      { error: "Failed to fetch ingredient", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/ingredients/[id] - Update an ingredient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const { id } = await params;
    const ingredientId = parseInt(id);

    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    // Verify ingredient belongs to company
    const existing = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { companyId: true, packPrice: true, packQuantity: true }
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, supplier, supplierId, packQuantity, packUnit, packPrice, currency, densityGPerMl, allergens, notes } = body;

    // Convert to base unit if packQuantity or packUnit changed
    let baseQuantity = existing.packQuantity;
    let baseUnit = existing.packUnit as BaseUnit;
    
    if (packQuantity && packUnit) {
      const converted = toBase(
        parseFloat(packQuantity),
        packUnit as Unit,
        densityGPerMl ? parseFloat(densityGPerMl) : undefined
      );
      baseQuantity = converted.amount;
      baseUnit = converted.base as BaseUnit;
    }

    const priceChanged = existing.packPrice.toString() !== packPrice;
    const quantityChanged = existing.packQuantity.toString() !== baseQuantity.toString();

    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        ...(name && { name: name.trim() }),
        ...(supplier !== undefined && { supplier: supplier || null }),
        ...(supplierId !== undefined && { supplierId: supplierId ? parseInt(supplierId) : null }),
        ...(packQuantity && { packQuantity: baseQuantity }),
        ...(packUnit && { packUnit: baseUnit, originalUnit: packUnit as Unit }),
        ...(packPrice !== undefined && { packPrice: parseFloat(packPrice) }),
        ...(currency && { currency }),
        ...(densityGPerMl !== undefined && { densityGPerMl: densityGPerMl ? parseFloat(densityGPerMl) : null }),
        ...(allergens !== undefined && { allergens }),
        ...(notes !== undefined && { notes: notes || null }),
        ...((priceChanged || quantityChanged) && { lastPriceUpdate: new Date() }),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating ingredient", error, "Ingredients");
    return NextResponse.json(
      { error: "Failed to update ingredient", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/ingredients/[id] - Delete an ingredient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const { id } = await params;
    const ingredientId = parseInt(id);

    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    // Verify ingredient belongs to company
    const existing = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { 
        companyId: true,
        name: true,
        recipeItems: {
          select: {
            recipe: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if used in recipes
    if (existing.recipeItems && existing.recipeItems.length > 0) {
      const recipeNames = existing.recipeItems
        .map(item => item.recipe.name)
        .filter((name, index, self) => self.indexOf(name) === index)
        .slice(0, 5);
      
      return NextResponse.json({
        error: `Cannot delete "${existing.name}" because it's used in recipes: ${recipeNames.join(", ")}`
      }, { status: 400 });
    }

    await prisma.ingredient.delete({ where: { id: ingredientId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting ingredient", error, "Ingredients");
    return NextResponse.json(
      { error: "Failed to delete ingredient", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


