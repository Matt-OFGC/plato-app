import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeResponse } from "@/lib/api-optimization";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { portalToken: token },
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

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const summaries = await prisma.salesSummary.findMany({
      where: {
        customerId: customer.id,
        periodStart: { gte: startDate },
        periodType: "DAILY",
      },
      orderBy: { periodStart: "asc" },
    });

    const totals = summaries.reduce(
      (acc, s) => ({
        delivered: acc.delivered + s.totalDelivered,
        sold: acc.sold + s.totalSold,
        wasted: acc.wasted + s.totalWasted,
      }),
      { delivered: 0, sold: 0, wasted: 0 }
    );

    const avgSellThrough =
      totals.delivered > 0 ? (totals.sold / totals.delivered) * 100 : 0;
    const wasteRate =
      totals.delivered > 0 ? (totals.wasted / totals.delivered) * 100 : 0;

    const byProduct = await prisma.salesSummary.groupBy({
      by: ["recipeId"],
      where: {
        customerId: customer.id,
        periodStart: { gte: startDate },
        periodType: "DAILY",
      },
      _sum: {
        totalDelivered: true,
        totalSold: true,
        totalWasted: true,
      },
    });

    const recipeIds = byProduct
      .map((p) => p.recipeId)
      .filter((id): id is number => id !== null);

    const recipes =
      recipeIds.length > 0
        ? await prisma.recipe.findMany({
            where: { id: { in: recipeIds } },
            select: { id: true, name: true },
          })
        : [];

    const productPerformance = byProduct.map((p) => {
      const recipe = recipes.find((r) => r.id === p.recipeId);
      const delivered = p._sum.totalDelivered || 0;
      const sold = p._sum.totalSold || 0;

      return {
        productName: recipe?.name || "Unknown",
        totalSold: sold,
        totalWasted: p._sum.totalWasted || 0,
        sellThroughRate: delivered > 0 ? (sold / delivered) * 100 : 0,
      };
    });

    return NextResponse.json(
      serializeResponse({
        period: { days, startDate },
        totals,
        avgSellThrough,
        wasteRate,
        dailyTrend: summaries.map((s) => ({
          date: s.periodStart,
          sold: s.totalSold,
        })),
        productPerformance: productPerformance.sort(
          (a, b) => b.totalSold - a.totalSold
        ),
      }),
      {
        status: 200,
        headers: { "Content-Encoding": "identity" },
      }
    );
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Get portal analytics error", error, "Wholesale/Portal");
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}

