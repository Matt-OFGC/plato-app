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

    // Log raw orders for debugging
    logger.debug(`Raw orders query result: ${orders.length} orders found`, {
      companyId: parsedCompanyId,
      startDate,
      endDate,
      orderDetails: orders.map(o => ({
        id: o.id,
        status: o.status,
        deliveryDate: o.deliveryDate,
        itemCount: o.items.length,
        recipeIds: o.items.map(i => i.recipeId).filter(Boolean),
      })),
    }, "Wholesale/Orders/Unplanned");

    // For each order, check if it has allocations in production plans
    const ordersWithCoverage = await Promise.all(
      orders.map(async (order) => {
        // Skip orders without items or without recipeIds
        const validRecipeIds = order.items
          .map(item => item.recipeId)
          .filter((id): id is number => id !== null && id !== undefined);
        
        if (validRecipeIds.length === 0) {
          // Order has no valid recipe items - mark as unplanned
          return {
            ...order,
            isPlanned: false,
            linkedPlans: [],
          };
        }
        
        // Build plan date filter - if order has deliveryDate, check plans that overlap
        // If order has no deliveryDate, check plans in the requested date range
        const planDateFilter: any = {
          companyId: parsedCompanyId,
        };
        
        if (order.deliveryDate) {
          // Order has delivery date - find plans that overlap with that date
          planDateFilter.startDate = { lte: order.deliveryDate };
          planDateFilter.endDate = { gte: order.deliveryDate };
        } else if (startDate && endDate) {
          // Order has no delivery date - check plans in the requested date range
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          planDateFilter.OR = [
            {
              startDate: { lte: end },
              endDate: { gte: start },
            },
          ];
        }
        
        const productionItems = await prisma.productionItem.findMany({
          where: {
            recipeId: {
              in: validRecipeIds,
            },
            plan: planDateFilter,
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

    // Log for debugging
    logger.debug(`Unplanned orders query: Found ${orders.length} confirmed orders, ${unplannedOrders.length} unplanned`, {
      companyId: parsedCompanyId,
      startDate,
      endDate,
      totalOrders: orders.length,
      unplannedCount: unplannedOrders.length,
      plannedCount: ordersWithCoverage.filter(o => o.isPlanned).length,
      unplannedOrderIds: unplannedOrders.map(o => o.id),
      plannedOrderIds: ordersWithCoverage.filter(o => o.isPlanned).map(o => o.id),
    }, "Wholesale/Orders/Unplanned");

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

