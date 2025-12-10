import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { canAccessWholesale, createFeatureGateError } from "@/lib/subscription";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await canAccessWholesale(session.id);
    if (!hasAccess) {
      return NextResponse.json(
        createFeatureGateError("production", "Wholesale Payments"),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const customerId = searchParams.get("customerId");
    const invoiceId = searchParams.get("invoiceId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const parsedCompanyId = parseInt(companyId);

    const hasCompany = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasCompany) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    const where: any = { companyId: parsedCompanyId };
    if (customerId) {
      where.customerId = parseInt(customerId);
    }
    if (invoiceId) {
      where.invoiceId = parseInt(invoiceId);
    }

    const payments = await prisma.wholesalePayment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return NextResponse.json(
      payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toString(),
        invoice: {
          ...payment.invoice,
          total: payment.invoice.total.toString(),
        },
      }))
    );
  } catch (error) {
    logger.error("Failed to fetch payments", error, "Wholesale/Payments");
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await canAccessWholesale(session.id);
    if (!hasAccess) {
      return NextResponse.json(
        createFeatureGateError("production", "Wholesale Payments"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      invoiceId,
      customerId,
      companyId,
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
    } = body;

    if (!invoiceId || !customerId || !companyId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "invoiceId, customerId, companyId, amount, and paymentMethod are required" },
        { status: 400 }
      );
    }

    const parsedCompanyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;
    const parsedCustomerId = typeof customerId === 'string' ? parseInt(customerId) : customerId;
    const parsedInvoiceId = typeof invoiceId === 'string' ? parseInt(invoiceId) : invoiceId;
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    const hasCompany = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasCompany) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Get invoice to check current status
    const invoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: parsedInvoiceId },
      select: {
        total: true,
        paidAmount: true,
        status: true,
        customerId: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.customerId !== parsedCustomerId) {
      return NextResponse.json(
        { error: "Invoice does not belong to this customer" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.wholesalePayment.create({
      data: {
        invoiceId: parsedInvoiceId,
        customerId: parsedCustomerId,
        companyId: parsedCompanyId,
        amount: parsedAmount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod,
        reference,
        notes,
        createdBy: session.id,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update invoice paid amount and status
    const newPaidAmount = (invoice.paidAmount || 0) + parsedAmount;
    const isFullyPaid = newPaidAmount >= Number(invoice.total);
    const isPartiallyPaid = newPaidAmount > 0 && newPaidAmount < Number(invoice.total);

    await prisma.wholesaleInvoice.update({
      where: { id: parsedInvoiceId },
      data: {
        paidAmount: newPaidAmount,
        paidDate: isFullyPaid ? new Date() : invoice.paidDate,
        status: isFullyPaid ? "paid" : isPartiallyPaid ? "partial" : invoice.status,
      },
    });

    // Update customer balances
    await prisma.wholesaleCustomer.update({
      where: { id: parsedCustomerId },
      data: {
        totalPaid: {
          increment: parsedAmount,
        },
        outstandingBalance: {
          decrement: parsedAmount,
        },
      },
    });

    return NextResponse.json({
      ...payment,
      amount: payment.amount.toString(),
    });
  } catch (error) {
    logger.error("Failed to record payment", error, "Wholesale/Payments");
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

