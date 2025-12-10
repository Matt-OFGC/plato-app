import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { addDays } from "date-fns";

// Generate next invoice number
async function generateInvoiceNumber(companyId: number): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  const lastInvoice = await prisma.wholesaleInvoice.findFirst({
    where: {
      companyId,
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  });

  if (!lastInvoice) {
    return `${prefix}001`;
  }

  const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ""));
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
  return `${prefix}${nextNumber}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { taxRate } = body;

    const order = await prisma.wholesaleOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                wholesalePrice: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const hasAccess = await hasCompanyAccess(session.id, order.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this order" },
        { status: 403 }
      );
    }

    // Check if invoice already exists for this order
    const existingInvoice = await prisma.wholesaleInvoice.findFirst({
      where: { orderId },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: "Invoice already exists for this order", invoiceId: existingInvoice.id },
        { status: 400 }
      );
    }

    // Calculate totals using wholesale prices
    let subtotal = 0;
    for (const item of order.items) {
      // Use order item price if set, otherwise use recipe wholesale price, otherwise 0
      let itemPrice = item.price ? Number(item.price) : 0;
      if (!itemPrice && item.recipe.wholesalePrice) {
        itemPrice = Number(item.recipe.wholesalePrice);
      }
      subtotal += itemPrice * item.quantity;
    }

    const taxRateValue = taxRate ? parseFloat(taxRate) : 0;
    const taxAmount = subtotal * (taxRateValue / 100);
    const total = subtotal + taxAmount;

    // Calculate due date from payment terms
    let dueDate = new Date();
    if (order.customer.paymentTerms) {
      const netMatch = order.customer.paymentTerms.match(/Net\s+(\d+)/i);
      if (netMatch) {
        const days = parseInt(netMatch[1]);
        dueDate = addDays(new Date(), days);
      } else {
        // Default to 30 days if payment terms don't match pattern
        dueDate = addDays(new Date(), 30);
      }
    } else {
      dueDate = addDays(new Date(), 30);
    }

    const invoiceNumber = await generateInvoiceNumber(order.companyId);

    const invoice = await prisma.wholesaleInvoice.create({
      data: {
        invoiceNumber,
        orderId,
        customerId: order.customerId,
        companyId: order.companyId,
        issueDate: new Date(),
        dueDate,
        subtotal,
        taxRate: taxRateValue,
        taxAmount,
        total,
        status: "draft",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    // Update customer outstanding balance
    await prisma.wholesaleCustomer.update({
      where: { id: order.customerId },
      data: {
        outstandingBalance: {
          increment: total,
        },
      },
    });

    return NextResponse.json({
      ...invoice,
      subtotal: invoice.subtotal.toString(),
      taxRate: invoice.taxRate.toString(),
      taxAmount: invoice.taxAmount.toString(),
      total: invoice.total.toString(),
    });
  } catch (error) {
    logger.error("Failed to create invoice from order", error, "Wholesale/Orders");
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

