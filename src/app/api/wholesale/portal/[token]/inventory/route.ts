import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeResponse } from "@/lib/api-optimization";

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

    const inventory = await prisma.customerInventory.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      include: {
        recipe: { select: { id: true, name: true, imageUrl: true } },
        productionItem: {
          select: { id: true, recipe: { select: { name: true } } },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    const now = new Date();
    const withStatus = inventory.map((item) => {
      const daysUntilExpiry = Math.ceil(
        (item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const expiryStatus =
        daysUntilExpiry > 2
          ? "fresh"
          : daysUntilExpiry > 0
            ? "expiring_soon"
            : "expired";

      return {
        ...item,
        daysUntilExpiry,
        expiryStatus,
      };
    });

    return NextResponse.json(serializeResponse({ inventory: withStatus }), {
      status: 200,
      headers: { "Content-Encoding": "identity" },
    });
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Get portal inventory error", error, "Wholesale/Portal");
    return NextResponse.json(
      { error: "Failed to load inventory" },
      { status: 500 }
    );
  }
}

