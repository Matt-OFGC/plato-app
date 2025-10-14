import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// GET /api/wholesale/products/[id] - Get a specific wholesale product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.wholesaleProduct.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            yieldQuantity: true,
            yieldUnit: true,
            category: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Serialize Decimal fields
    const serializedProduct = {
      ...product,
      price: product.price.toString(),
      recipe: product.recipe
        ? {
            ...product.recipe,
            yieldQuantity: product.recipe.yieldQuantity.toString(),
          }
        : null,
    };

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.error("Get wholesale product error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wholesale product" },
      { status: 500 }
    );
  }
}

// PATCH /api/wholesale/products/[id] - Update a wholesale product
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipeId,
      name,
      description,
      unit,
      price,
      currency,
      category,
      isActive,
      sortOrder,
      imageUrl,
      notes,
    } = body;

    const updateData: any = {};
    
    if (recipeId !== undefined) updateData.recipeId = recipeId ? parseInt(recipeId) : null;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (unit !== undefined) updateData.unit = unit;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (currency !== undefined) updateData.currency = currency;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (notes !== undefined) updateData.notes = notes;

    const product = await prisma.wholesaleProduct.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            yieldQuantity: true,
            yieldUnit: true,
            category: true,
          },
        },
      },
    });

    // Serialize Decimal fields
    const serializedProduct = {
      ...product,
      price: product.price.toString(),
      recipe: product.recipe
        ? {
            ...product.recipe,
            yieldQuantity: product.recipe.yieldQuantity.toString(),
          }
        : null,
    };

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.error("Update wholesale product error:", error);
    return NextResponse.json(
      { error: "Failed to update wholesale product" },
      { status: 500 }
    );
  }
}

// DELETE /api/wholesale/products/[id] - Delete a wholesale product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.wholesaleProduct.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wholesale product error:", error);
    return NextResponse.json(
      { error: "Failed to delete wholesale product" },
      { status: 500 }
    );
  }
}

