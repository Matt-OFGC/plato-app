import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

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

    // Build the where clause
    const where: any = {
      companyId: parseInt(companyId),
      status: {
        in: ["pending", "confirmed", "in_production"],
      },
    };

    // If date range provided, filter by delivery date
    if (startDate && endDate) {
      where.deliveryDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
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
              companyId: parseInt(companyId),
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

    return NextResponse.json(ordersWithCoverage);
  } catch (error) {
    console.error("Get unplanned orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch unplanned orders" },
      { status: 500 }
    );
  }
}

