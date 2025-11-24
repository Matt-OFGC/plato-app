import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

// GET /api/wholesale/products/[id] - Get a specific wholesale product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    
    const product = await prisma.wholesaleProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        companyId: true,
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

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, product.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this product" },
        { status: 403 }
      );
    }

    // Re-fetch with full data after authorization check
    const fullProduct = await prisma.wholesaleProduct.findUnique({
      where: { id: productId },
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
      ...fullProduct,
      price: product.price.toString(),
      recipe: product.recipe
        ? {
            ...product.recipe,
            yieldQuantity: product.recipe.yieldQuantity.toString(),
          }
        : null,
    };

    return createOptimizedResponse(serializedProduct, {
      cacheType: 'frequent',
      compression: true,
    });
  } catch (error) {
    logger.error("Get wholesale product error", error, "Wholesale/Products");
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

    // Verify product exists and user has access
    const existingProduct = await prisma.wholesaleProduct.findUnique({
      where: { id: parseInt(params.id) },
      select: { companyId: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, existingProduct.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this product" },
        { status: 403 }
      );
    }

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
    logger.error("Update wholesale product error", error, "Wholesale/Products");
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

    // Verify product exists and user has access
    const product = await prisma.wholesaleProduct.findUnique({
      where: { id: parseInt(params.id) },
      select: { companyId: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, product.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this product" },
        { status: 403 }
      );
    }

    await prisma.wholesaleProduct.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete wholesale product error", error, "Wholesale/Products");
    return NextResponse.json(
      { error: "Failed to delete wholesale product" },
      { status: 500 }
    );
  }
}

