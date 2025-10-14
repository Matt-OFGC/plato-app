import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ingredients } = await request.json();

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "Invalid ingredients data" }, { status: 400 });
    }

    // Create ingredients in batch
    const createdIngredients = await prisma.ingredient.createMany({
      data: ingredients.map((ingredient: any) => ({
        name: ingredient.name,
        packQuantity: ingredient.packQuantity,
        packUnit: ingredient.packUnit,
        packPrice: ingredient.packPrice,
        currency: ingredient.currency || "GBP",
        companyId,
        // Set default values for required fields
        densityGPerMl: null,
        supplier: "Imported",
        notes: "Imported from invoice scan",
        lastPriceUpdate: new Date(),
      })),
      skipDuplicates: true, // Skip if ingredient with same name already exists
    });

    return NextResponse.json({
      success: true,
      count: createdIngredients.count,
      message: `Successfully created ${createdIngredients.count} ingredients`
    });

  } catch (error) {
    console.error("Bulk ingredient creation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create ingredients",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}