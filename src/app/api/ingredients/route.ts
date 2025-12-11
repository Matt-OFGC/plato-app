import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";
import { toBase, BaseUnit, Unit } from "@/lib/units";

// GET /api/ingredients - Get all ingredients
export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const ingredientsRaw = await prisma.ingredient.findMany({
      where: { companyId },
      include: { supplierRef: true },
      orderBy: { name: "asc" }
    });

    const ingredients = ingredientsRaw.map(ing => ({
      id: ing.id,
      name: ing.name,
      supplier: ing.supplier || null,
      supplierId: ing.supplierId || null,
      packQuantity: ing.packQuantity.toString(),
      packUnit: ing.packUnit,
      originalUnit: ing.originalUnit || ing.packUnit,
      packPrice: ing.packPrice.toString(),
      currency: ing.currency || "GBP",
      densityGPerMl: ing.densityGPerMl?.toString() || null,
      allergens: Array.isArray(ing.allergens) ? ing.allergens : (typeof ing.allergens === 'string' ? JSON.parse(ing.allergens || '[]') : []),
      notes: ing.notes || null,
      createdAt: ing.createdAt.toISOString(),
      updatedAt: ing.updatedAt.toISOString(),
      supplierRef: ing.supplierRef ? {
        id: ing.supplierRef.id,
        name: ing.supplierRef.name
      } : null
    }));

    return createOptimizedResponse(ingredients, {
      cacheType: 'frequent',
      compression: false,
    });
  } catch (error) {
    logger.error("Error fetching ingredients", error, "Ingredients");
    return NextResponse.json(
      { error: "Failed to fetch ingredients", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/ingredients - Create a new ingredient
export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, supplier, supplierId, packQuantity, packUnit, packPrice, currency, densityGPerMl, allergens, notes } = body;

    if (!name || !packQuantity || !packUnit || packPrice === undefined) {
      return NextResponse.json({ error: "Name, pack quantity, pack unit, and pack price are required" }, { status: 400 });
    }

    // Check if ingredient already exists
    const existing = await prisma.ingredient.findFirst({
      where: { name, companyId }
    });

    if (existing) {
      return NextResponse.json({ error: `An ingredient named "${name}" already exists` }, { status: 400 });
    }

    // Convert to base unit
    const { amount: baseQuantity, base: baseUnit } = toBase(
      parseFloat(packQuantity),
      packUnit as Unit,
      densityGPerMl ? parseFloat(densityGPerMl) : undefined
    );

    const ingredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        supplier: supplier || null,
        supplierId: supplierId ? parseInt(supplierId) : null,
        packQuantity: baseQuantity,
        packUnit: baseUnit as BaseUnit,
        originalUnit: packUnit as Unit,
        packPrice: parseFloat(packPrice),
        currency: currency || "GBP",
        densityGPerMl: densityGPerMl ? parseFloat(densityGPerMl) : null,
        allergens: allergens || [],
        notes: notes || null,
        companyId,
      }
    });

    return NextResponse.json({
      success: true,
      ingredient: {
        id: ingredient.id,
        name: ingredient.name,
        packQuantity: ingredient.packQuantity.toString(),
        packUnit: ingredient.packUnit,
        packPrice: ingredient.packPrice.toString()
      }
    }, { status: 201 });
  } catch (error) {
    logger.error("Error creating ingredient", error, "Ingredients");
    return NextResponse.json(
      { error: "Failed to create ingredient", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}




