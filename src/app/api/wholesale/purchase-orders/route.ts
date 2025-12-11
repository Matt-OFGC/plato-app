import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";

const purchaseOrderSchema = z.object({
  supplierId: z.number().int().positive(),
  orderNumber: z.string().optional(),
  expectedDelivery: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    ingredientId: z.number().int().positive(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    notes: z.string().optional(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const { user, companyId } = await getCurrentUserAndCompany();
    if (!user || !companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = purchaseOrderSchema.parse(body);

    // Calculate total amount
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );

    // Create purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId: validatedData.supplierId,
        orderNumber: validatedData.orderNumber,
        expectedDelivery: validatedData.expectedDelivery ? new Date(validatedData.expectedDelivery) : null,
        notes: validatedData.notes,
        totalAmount,
        status: 'DRAFT',
        items: {
          create: validatedData.items.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            notes: item.notes,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, purchaseOrder });
  } catch (error) {
    logger.error("Error creating purchase order", error, "Wholesale/PurchaseOrders");
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { companyId },
      include: {
        supplier: true,
        items: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Serialize Decimal fields
    const serializedOrders = purchaseOrders.map(order => ({
      ...order,
      totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
      items: order.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        receivedQuantity: item.receivedQuantity ? Number(item.receivedQuantity) : null,
      })),
    }));

    return NextResponse.json({ purchaseOrders: serializedOrders });
  } catch (error) {
    logger.error("Error fetching purchase orders", error, "Wholesale/PurchaseOrders");
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}
