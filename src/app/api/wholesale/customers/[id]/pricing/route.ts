import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

// Get all custom pricing for a customer
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
    const customerId = parseInt(id);

    // Verify customer exists and user has access
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { id: customerId },
      select: { companyId: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, customer.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this customer" },
        { status: 403 }
      );
    }

    const pricing = await prisma.customerPricing.findMany({
      where: { customerId },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            yieldQuantity: true,
            yieldUnit: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { recipe: { name: "asc" } },
    });

    return createOptimizedResponse(pricing, {
      cacheType: 'frequent',
      compression: true,
    });
  } catch (error) {
    logger.error("Get customer pricing error", error, "Wholesale/Customers/Pricing");
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}

// Set or update custom pricing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customerId = parseInt(id);
    const body = await request.json();
    const { recipeId, price, unit, notes } = body;

    if (!recipeId || price === undefined) {
      return NextResponse.json(
        { error: "Recipe ID and price are required" },
        { status: 400 }
      );
    }

    // Verify customer exists and user has access
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { id: customerId },
      select: { companyId: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, customer.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this customer" },
        { status: 403 }
      );
    }

    const pricing = await prisma.customerPricing.upsert({
      where: {
        customerId_recipeId: {
          customerId,
          recipeId,
        },
      },
      create: {
        customerId,
        recipeId,
        price,
        unit: unit || "each",
        notes,
      },
      update: {
        price,
        unit: unit || "each",
        notes,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            yieldQuantity: true,
            yieldUnit: true,
          },
        },
      },
    });

    return NextResponse.json(pricing);
  } catch (error) {
    logger.error("Set customer pricing error", error, "Wholesale/Customers/Pricing");
    return NextResponse.json(
      { error: "Failed to set pricing" },
      { status: 500 }
    );
  }
}

// Delete custom pricing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customerId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    // Verify customer exists and user has access
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { id: customerId },
      select: { companyId: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, customer.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this customer" },
        { status: 403 }
      );
    }

    await prisma.customerPricing.delete({
      where: {
        customerId_recipeId: {
          customerId,
          recipeId: parseInt(recipeId),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete customer pricing error", error, "Wholesale/Customers/Pricing");
    return NextResponse.json(
      { error: "Failed to delete pricing" },
      { status: 500 }
    );
  }
}

