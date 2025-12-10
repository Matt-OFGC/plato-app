import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const parsedCompanyId = parseInt(companyId);

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Build the where clause - only show confirmed orders (not pending, not already in production)
    const where: any = {
      companyId: parsedCompanyId,
      status: "confirmed",
    };

    // If date range provided, filter by delivery date
    // Include orders with deliveryDate in range OR orders without deliveryDate (null)
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      where.OR = [
        {
          deliveryDate: {
            gte: start,
            lte: end,
          },
        },
        {
          deliveryDate: null,
        },
      ];
    }

    // Get orders that are not linked to any production plans
    // We'll check this by looking at ProductionItemAllocation
    const orders = await prisma.wholesaleOrder.findMany({
      where,
      include: {
        customer: true,
        items: {
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
        },
      },
      orderBy: [
        { deliveryDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // For each order, check if it has allocations in production plans
    const ordersWithCoverage = await Promise.all(
      orders.map(async (order) => {
        // Check if any of this order's items have allocations
        // We need to find production items that match the recipes in this order
        // and check if they have allocations for this customer
        
        const productionItems = await prisma.productionItem.findMany({
          where: {
            recipeId: {
              in: order.items.map(item => item.recipeId),
            },
            plan: {
              companyId: parsedCompanyId,
              startDate: { lte: order.deliveryDate || new Date() },
              endDate: { gte: order.deliveryDate || new Date() },
            },
            allocations: {
              some: {
                customerId: order.customerId,
              },
            },
          },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return {
          ...order,
          isPlanned: productionItems.length > 0,
          linkedPlans: Array.from(
            new Set(productionItems.map(item => item.plan))
          ),
        };
      })
    );

    // Filter out orders that are already planned
    const unplannedOrders = ordersWithCoverage.filter(order => !order.isPlanned);

    return createOptimizedResponse(unplannedOrders, {
      cacheType: 'dynamic',
      compression: true,
    });
  } catch (error) {
    logger.error("Failed to fetch unplanned orders", error, "Wholesale/Orders");
    return NextResponse.json(
      { error: "Failed to fetch unplanned orders" },
      { status: 500 }
    );
  }
}

