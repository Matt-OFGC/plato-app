import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { emitEvent, EventTypes } from "@/lib/events/domain-events";
import { logger } from "@/lib/logger";

const updatePurchaseOrderSchema = z.object({
  status: z.enum(['DRAFT', 'ORDERED', 'RECEIVED', 'INVOICED', 'CANCELLED']).optional(),
  expectedDelivery: z.string().datetime().optional(),
  notes: z.string().optional(),
  receivedAt: z.string().datetime().optional(),
  invoicedAt: z.string().datetime().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, companyId } = await getCurrentUserAndCompany();
    if (!user || !companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updatePurchaseOrderSchema.parse(body);

    // Check if order exists and belongs to company
    const existingOrder = await prisma.purchaseOrder.findFirst({
      where: { id: orderId, companyId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.status) {
      updateData.status = validatedData.status;
      
      // Set timestamps based on status
      if (validatedData.status === 'RECEIVED' && !existingOrder.receivedAt) {
        updateData.receivedAt = new Date();
      }
      if (validatedData.status === 'INVOICED' && !existingOrder.invoicedAt) {
        updateData.invoicedAt = new Date();
      }
    }
    
    if (validatedData.expectedDelivery) {
      updateData.expectedDelivery = new Date(validatedData.expectedDelivery);
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }
    if (validatedData.receivedAt) {
      updateData.receivedAt = new Date(validatedData.receivedAt);
    }
    if (validatedData.invoicedAt) {
      updateData.invoicedAt = new Date(validatedData.invoicedAt);
    }

    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        supplier: true,
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    // Emit domain event when status changes to RECEIVED
    // This will trigger inventory updates in other apps
    if (validatedData.status === 'RECEIVED') {
      await emitEvent(EventTypes.PURCHASE_ORDER_RECEIVED, {
        orderId: updatedOrder.id,
        supplierId: updatedOrder.supplierId,
        items: updatedOrder.items.map(item => ({
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      }, companyId, {
        userId: user.id,
        source: 'purchase_order_api',
        timestamp: new Date(),
      });
    }

    // Serialize Decimal fields
    const serializedOrder = {
      ...updatedOrder,
      totalAmount: updatedOrder.totalAmount ? Number(updatedOrder.totalAmount) : null,
      items: updatedOrder.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        receivedQuantity: item.receivedQuantity ? Number(item.receivedQuantity) : null,
      })),
    };

    return NextResponse.json({ success: true, purchaseOrder: serializedOrder });
  } catch (error) {
    logger.error("Error updating purchase order", error, "Wholesale/PurchaseOrders");
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, companyId } = await getCurrentUserAndCompany();
    if (!user || !companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Check if order exists and belongs to company
    const existingOrder = await prisma.purchaseOrder.findFirst({
      where: { id: orderId, companyId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    // Only allow deletion of DRAFT orders
    if (existingOrder.status !== 'DRAFT') {
      return NextResponse.json({ 
        error: "Only draft purchase orders can be deleted" 
      }, { status: 400 });
    }

    await prisma.purchaseOrder.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting purchase order", error, "Wholesale/PurchaseOrders");
    return NextResponse.json({ error: "Failed to delete purchase order" }, { status: 500 });
  }
}
