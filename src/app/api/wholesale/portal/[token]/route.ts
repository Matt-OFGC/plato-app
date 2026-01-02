import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOptimizedResponse, serializeResponse } from "@/lib/api-optimization";

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

    // Get customer's recent orders (already parallelized with products/pricing above)
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

    // Get customer invoices
    const invoices = await prisma.wholesaleInvoice.findMany({
      where: { customerId: customer.id, companyId: customer.companyId },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        currency: true,
        issueDate: true,
        dueDate: true,
        paidAmount: true,
      },
      orderBy: { issueDate: "desc" },
      take: 20,
    });

    const payload = {
      customer: {
        id: customer.id,
        name: customer.name,
        companyId: customer.companyId,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postcode: customer.postcode,
        country: customer.country,
        notes: customer.notes,
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
      invoices: invoices.map((inv) => ({
        ...inv,
        total: inv.total?.toString() ?? "0",
        paidAmount: inv.paidAmount?.toString() ?? "0",
      })),
    };

    // Use plain JSON response to avoid any accidental content-encoding issues
    return NextResponse.json(serializeResponse(payload), {
      status: 200,
      headers: {
        "Content-Encoding": "identity",
      },
    });
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Get portal info error", error, "Wholesale/Portal");
    return NextResponse.json(
      { error: "Failed to load portal" },
      { status: 500 }
    );
  }
}

// Update customer info from portal
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { portalToken: token },
    });

    if (!customer) {
      return NextResponse.json({ error: "Invalid portal token" }, { status: 404 });
    }

    if (!customer.portalEnabled) {
      return NextResponse.json({ error: "Portal access is disabled" }, { status: 403 });
    }

    const body = await req.json();
    const allowed = {
      contactName: body.contactName ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      postcode: body.postcode ?? null,
      country: body.country ?? null,
      notes: body.notes ?? null,
    };

    const updated = await prisma.wholesaleCustomer.update({
      where: { id: customer.id },
      data: allowed,
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postcode: true,
        country: true,
        notes: true,
      },
    });

    return NextResponse.json(serializeResponse(updated), {
      status: 200,
      headers: { "Content-Encoding": "identity" },
    });
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Update portal customer error", error, "Wholesale/Portal");
    return NextResponse.json(
      { error: "Failed to update customer info" },
      { status: 500 }
    );
  }
}

