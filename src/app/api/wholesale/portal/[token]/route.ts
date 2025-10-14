import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get customer info and available products by portal token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { portalToken: token },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid portal token" },
        { status: 404 }
      );
    }

    if (!customer.portalEnabled) {
      return NextResponse.json(
        { error: "Portal access is disabled" },
        { status: 403 }
      );
    }

    // Get wholesale products (active only)
    const products = await prisma.wholesaleProduct.findMany({
      where: {
        companyId: customer.companyId,
        isActive: true,
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
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Get custom pricing for this customer
    const customPricing = await prisma.customerPricing.findMany({
      where: { customerId: customer.id },
    });

    // Map custom prices to recipes
    const priceMap = new Map(customPricing.map(p => [p.recipeId, p.price.toString()]));
    
    // Format products for customer view
    const formattedProducts = products.map(product => {
      const displayName = product.name || product.recipe?.name || "Product";
      const displayDescription = product.description || product.recipe?.description;
      const displayImage = product.imageUrl || product.recipe?.imageUrl;
      const displayCategory = product.category || product.recipe?.category;
      
      // Check if customer has custom pricing for this recipe
      const customPrice = product.recipeId ? priceMap.get(product.recipeId) : null;
      const finalPrice = customPrice || product.price.toString();
      
      return {
        id: product.id,
        recipeId: product.recipeId,
        name: displayName,
        description: displayDescription,
        imageUrl: displayImage,
        unit: product.unit,
        price: finalPrice,
        currency: product.currency,
        category: displayCategory,
        yieldQuantity: product.recipe?.yieldQuantity?.toString(),
        yieldUnit: product.recipe?.yieldUnit,
        hasCustomPrice: !!customPrice,
      };
    });

    // Get customer's recent orders
    const recentOrders = await prisma.wholesaleOrder.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        items: {
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
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        companyId: customer.companyId,
      },
      company: customer.company,
      products: formattedProducts,
      recentOrders: recentOrders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          price: item.price ? item.price.toString() : null,
        })),
      })),
    });
  } catch (error) {
    console.error("Get portal info error:", error);
    return NextResponse.json(
      { error: "Failed to load portal" },
      { status: 500 }
    );
  }
}

