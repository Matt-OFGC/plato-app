import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { serializeResponse } from "@/lib/api-optimization";

const stockCheckSchema = z.object({
  inventoryId: z.number().int(),
  sales: z.number().int().min(0),
  wastage: z.number().int().min(0),
  notes: z.string().optional(),
});

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(
  _req: Request,
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

    const { start, end } = getTodayRange();

    const inventory = await prisma.customerInventory.findMany({
      where: {
        customerId: customer.id,
        status: "ACTIVE",
      },
      include: {
        recipe: { select: { id: true, name: true, imageUrl: true } },
        productionItem: {
          select: { id: true, recipe: { select: { name: true } } },
        },
        stockChecks: {
          where: { checkDate: { gte: start, lt: end } },
          take: 1,
        },
      },
    });

    const pending = inventory.filter((item) => item.stockChecks.length === 0);
    const completed = inventory.filter((item) => item.stockChecks.length > 0);

    return NextResponse.json(
      serializeResponse({ pending, completed }),
      {
        status: 200,
        headers: { "Content-Encoding": "identity" },
      }
    );
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Get portal stock checks error", error, "Wholesale/Portal");
    return NextResponse.json(
      { error: "Failed to load stock checks" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await req.json();
    const data = stockCheckSchema.parse(body);

    const inventory = await prisma.customerInventory.findUnique({
      where: { id: data.inventoryId },
    });

    if (!inventory || inventory.customerId !== customer.id) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    const closingStock = inventory.currentStock - data.sales - data.wastage;
    if (closingStock < 0) {
      return NextResponse.json(
        { error: "Sales + wastage exceed current stock" },
        { status: 400 }
      );
    }

    const { start, end } = getTodayRange();

    const [stockCheck] = await prisma.$transaction([
      prisma.stockCheck.create({
        data: {
          customerId: customer.id,
          inventoryId: data.inventoryId,
          checkDate: start,
          openingStock: inventory.currentStock,
          sales: data.sales,
          wastage: data.wastage,
          closingStock,
          notes: data.notes,
        },
      }),
      prisma.customerInventory.update({
        where: { id: data.inventoryId },
        data: {
          currentStock: closingStock,
          status: closingStock === 0 ? "SOLD_OUT" : "ACTIVE",
        },
      }),
    ]);

    // Unique constraint will throw if duplicate; surface friendly message
    return NextResponse.json({ success: true, stockCheck });
  } catch (error: any) {
    const { logger } = await import("@/lib/logger");

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Stock check already submitted for today" },
        { status: 409 }
      );
    }

    logger.error("Create portal stock check error", error, "Wholesale/Portal");
    return NextResponse.json(
      { error: "Failed to save stock check" },
      { status: 500 }
    );
  }
}

