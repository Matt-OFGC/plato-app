import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getYesterdayRange() {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { start, end } = getYesterdayRange();

    const checks = await prisma.stockCheck.findMany({
      where: { checkDate: { gte: start, lt: end } },
      include: {
        inventory: {
          select: {
            customerId: true,
            recipeId: true,
            productionItemId: true,
          },
        },
      },
    });

    const grouped = checks.reduce<Record<string, {
      customerId: number;
      recipeId: number | null;
      productionItemId: number | null;
      totalDelivered: number;
      totalSold: number;
      totalWasted: number;
    }>>((acc, check) => {
      const key = `${check.inventory.customerId}-${check.inventory.recipeId ?? "none"}`;
      if (!acc[key]) {
        acc[key] = {
          customerId: check.inventory.customerId,
          recipeId: check.inventory.recipeId,
          productionItemId: check.inventory.productionItemId,
          totalDelivered: 0,
          totalSold: 0,
          totalWasted: 0,
        };
      }
      acc[key].totalDelivered += check.openingStock;
      acc[key].totalSold += check.sales;
      acc[key].totalWasted += check.wastage;
      return acc;
    }, {});

    const tx = Object.values(grouped).map((data) =>
      prisma.salesSummary.upsert({
        where: {
          customerId_recipeId_periodStart_periodType: {
            customerId: data.customerId,
            recipeId: data.recipeId,
            periodStart: start,
            periodType: "DAILY",
          },
        },
        create: {
          customerId: data.customerId,
          recipeId: data.recipeId,
          productionItemId: data.productionItemId,
          periodStart: start,
          periodEnd: start,
          periodType: "DAILY",
          totalDelivered: data.totalDelivered,
          totalSold: data.totalSold,
          totalWasted: data.totalWasted,
          sellThroughRate:
            data.totalDelivered > 0
              ? (data.totalSold / data.totalDelivered) * 100
              : 0,
        },
        update: {
          totalDelivered: data.totalDelivered,
          totalSold: data.totalSold,
          totalWasted: data.totalWasted,
          sellThroughRate:
            data.totalDelivered > 0
              ? (data.totalSold / data.totalDelivered) * 100
              : 0,
        },
      })
    );

    if (tx.length > 0) {
      await prisma.$transaction(tx);
    }

    return NextResponse.json({ processed: tx.length });
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Aggregate sales cron error", error, "Cron/AggregateSales");
    return NextResponse.json(
      { error: "Failed to aggregate sales" },
      { status: 500 }
    );
  }
}

