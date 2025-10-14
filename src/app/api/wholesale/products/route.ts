import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// GET /api/wholesale/products - Get all wholesale products for a company
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const where: any = {
      companyId: parseInt(companyId),
    };

    if (activeOnly) {
      where.isActive = true;
    }

    const products = await prisma.wholesaleProduct.findMany({
      where,
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
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Serialize Decimal fields
    const serializedProducts = products.map((product) => ({
      ...product,
      price: product.price.toString(),
      recipe: product.recipe
        ? {
            ...product.recipe,
            yieldQuantity: product.recipe.yieldQuantity.toString(),
          }
        : null,
    }));

    return NextResponse.json(serializedProducts);
  } catch (error) {
    console.error("Get wholesale products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wholesale products" },
      { status: 500 }
    );
  }
}

// POST /api/wholesale/products - Create a new wholesale product
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyId,
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

    if (!companyId || !price) {
      return NextResponse.json(
        { error: "companyId and price are required" },
        { status: 400 }
      );
    }

    // Must have either recipeId or name
    if (!recipeId && !name) {
      return NextResponse.json(
        { error: "Either recipeId or name is required" },
        { status: 400 }
      );
    }

    const product = await prisma.wholesaleProduct.create({
      data: {
        companyId: parseInt(companyId),
        recipeId: recipeId ? parseInt(recipeId) : null,
        name,
        description,
        unit,
        price: parseFloat(price),
        currency: currency || "GBP",
        category,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        imageUrl,
        notes,
      },
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
    console.error("Create wholesale product error:", error);
    return NextResponse.json(
      { error: "Failed to create wholesale product" },
      { status: 500 }
    );
  }
}

