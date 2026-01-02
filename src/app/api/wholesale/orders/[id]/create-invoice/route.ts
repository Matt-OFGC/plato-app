import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-simple";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    const existingInvoice = await prisma.wholesaleInvoice.findFirst({
      where: { orderId },
    });
    if (existingInvoice) {
      return NextResponse.json(existingInvoice);
    }

    const order = await prisma.wholesaleOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      paymentTerms,
      dueDate,
      purchaseOrderNumber,
      notes,
    } = body || {};

    const hasAccess = await hasCompanyAccess(session.id, order.companyId);
    if (!hasAccess) {
      return NextResponse.json({ error: "No access to this order" }, { status: 403 });
    }

    const total = order.items.reduce((sum, item) => {
      const price = item.price ? Number(item.price) : 0;
      return sum + price * (item.quantity || 0);
    }, 0);

    const invoiceNumber = order.orderNumber || `INV-${order.id}-${Date.now()}`;
    const issueDate = new Date();

    let finalDueDate: Date | null = null;
    if (dueDate) {
      finalDueDate = new Date(dueDate);
    } else if (order.deliveryDate) {
      finalDueDate = new Date(order.deliveryDate);
    } else if (order.customer.defaultDueDays) {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + order.customer.defaultDueDays);
      finalDueDate = d;
    }

    const finalPaymentTerms = paymentTerms || order.customer.defaultPaymentTerms || null;
    const finalPurchaseOrderNumber = purchaseOrderNumber || order.customer.purchaseOrderNumber || null;

    const invoice = await prisma.wholesaleInvoice.create({
      data: {
        companyId: order.companyId,
        customerId: order.customerId,
        orderId: order.id,
        invoiceNumber,
        issueDate,
        dueDate: finalDueDate,
        status: "sent",
        total,
        currency: "GBP",
        notes: notes || order.notes || null,
        paymentTerms: finalPaymentTerms,
        purchaseOrderNumber: finalPurchaseOrderNumber,
      },
      include: {
        customer: true,
        order: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    logger.error("Create invoice from order failed", error, "Wholesale/Orders");
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
