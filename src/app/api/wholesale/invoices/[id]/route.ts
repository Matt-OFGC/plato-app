import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";

export async function GET(
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

    const invoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        order: {
          include: {
            items: {
              include: {
                recipe: {
                  select: {
                    id: true,
                    name: true,
                    yieldQuantity: true,
                    yieldUnit: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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

    return NextResponse.json({
      ...invoice,
      subtotal: invoice.subtotal.toString(),
      taxRate: invoice.taxRate.toString(),
      taxAmount: invoice.taxAmount.toString(),
      total: invoice.total.toString(),
      paidAmount: invoice.paidAmount?.toString(),
      customer: {
        ...invoice.customer,
        creditLimit: invoice.customer.creditLimit?.toString(),
        totalValue: invoice.customer.totalValue.toString(),
        totalPaid: invoice.customer.totalPaid.toString(),
        outstandingBalance: invoice.customer.outstandingBalance.toString(),
      },
      payments: invoice.payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toString(),
      })),
    });
  } catch (error) {
    logger.error("Failed to fetch invoice", error, "Wholesale/Invoices");
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const existingInvoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: invoiceId },
      select: { companyId: true, status: true },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const hasAccess = await hasCompanyAccess(session.id, existingInvoice.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this invoice" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl;
    if (body.emailSent !== undefined) {
      updateData.emailSent = body.emailSent;
      if (body.emailSent) {
        updateData.emailSentAt = new Date();
      }
    }

    const invoice = await prisma.wholesaleInvoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...invoice,
      subtotal: invoice.subtotal.toString(),
      taxRate: invoice.taxRate.toString(),
      taxAmount: invoice.taxAmount.toString(),
      total: invoice.total.toString(),
      paidAmount: invoice.paidAmount?.toString(),
    });
  } catch (error) {
    logger.error("Failed to update invoice", error, "Wholesale/Invoices");
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

