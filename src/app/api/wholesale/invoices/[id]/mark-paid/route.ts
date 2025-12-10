import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";

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
    const invoiceId = parseInt(id);
    const body = await request.json();
    const { amount, paymentMethod, reference, notes, paymentDate } = body;

    const invoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const hasAccess = await hasCompanyAccess(session.id, invoice.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this invoice" },
        { status: 403 }
      );
    }

    // If amount is provided, record as payment; otherwise mark as fully paid
    const paymentAmount = amount ? parseFloat(amount) : Number(invoice.total) - Number(invoice.paidAmount || 0);

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // Create payment record if payment details provided
    if (paymentMethod) {
      await prisma.wholesalePayment.create({
        data: {
          invoiceId,
          customerId: invoice.customerId,
          companyId: invoice.companyId,
          amount: paymentAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod,
          reference,
          notes,
          createdBy: session.id,
        },
      });
    }

    // Update invoice
    const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;
    const isFullyPaid = newPaidAmount >= Number(invoice.total);

    const updatedInvoice = await prisma.wholesaleInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        paidDate: isFullyPaid ? new Date() : invoice.paidDate,
        status: isFullyPaid ? "paid" : "partial",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update customer balances
    await prisma.wholesaleCustomer.update({
      where: { id: invoice.customerId },
      data: {
        totalPaid: {
          increment: paymentAmount,
        },
        outstandingBalance: {
          decrement: paymentAmount,
        },
      },
    });

    return NextResponse.json({
      ...updatedInvoice,
      subtotal: updatedInvoice.subtotal.toString(),
      taxRate: updatedInvoice.taxRate.toString(),
      taxAmount: updatedInvoice.taxAmount.toString(),
      total: updatedInvoice.total.toString(),
      paidAmount: updatedInvoice.paidAmount?.toString(),
    });
  } catch (error) {
    logger.error("Failed to mark invoice as paid", error, "Wholesale/Invoices");
    return NextResponse.json(
      { error: "Failed to mark invoice as paid" },
      { status: 500 }
    );
  }
}

