import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { forecastSales } from "@/lib/analytics/forecasting";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date();
    const recipeIds = searchParams.get("recipeIds") ? searchParams.get("recipeIds")!.split(',').map(Number) : undefined;
    
    // Also use wholesale order data for forecasting
    const filters = {
      companyId,
      startDate,
      endDate,
      recipeIds,
    };

    // Get forecasts from sales records
    const salesForecasts = await forecastSales(filters);

    // Get recurring orders for additional forecasting data
    const recurringOrders = await prisma.wholesaleOrder.findMany({
      where: {
        companyId,
        isRecurring: true,
        recurringStatus: "active",
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
    });

    // Combine forecasts with recurring order data
    const enhancedForecasts = salesForecasts.map(forecast => {
      // Find matching recurring orders
      const relatedOrders = recurringOrders.filter(order =>
        order.items.some(item => item.recipeId === forecast.recipeId)
      );

      // Calculate recurring order quantity
      const recurringQuantity = relatedOrders.reduce((sum, order) => {
        const item = order.items.find(item => item.recipeId === forecast.recipeId);
        return sum + (item ? Number(item.quantity) : 0);
      }, 0);

      return {
        ...forecast,
        recurringOrderQuantity: recurringQuantity,
        hasRecurringOrders: relatedOrders.length > 0,
      };
    });

    // Serialize Decimal values
    const serializedData = JSON.parse(
      JSON.stringify(enhancedForecasts, (key, value) => {
        if (value && typeof value === 'object' && value.isDecimal) {
          return value.toString();
        }
        return value;
      })
    );

    return NextResponse.json({
      data: serializedData,
      filters: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        recipeIds,
      },
      metadata: {
        recurringOrdersCount: recurringOrders.length,
      },
    });
  } catch (error) {
    logger.error("Sales forecast error", error, "Analytics/SalesForecast");
    return NextResponse.json(
      { error: "Failed to generate sales forecast" },
      { status: 500 }
    );
  }
}
