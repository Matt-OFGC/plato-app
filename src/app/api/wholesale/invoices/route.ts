import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { canAccessWholesale, createFeatureGateError } from "@/lib/subscription";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { addDays, parseISO } from "date-fns";

// Generate next invoice number
async function generateInvoiceNumber(companyId: number): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  // Find the highest invoice number for this year
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

  // Extract the number part and increment
  const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ""));
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
  return `${prefix}${nextNumber}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await canAccessWholesale(session.id);
    if (!hasAccess) {
      return NextResponse.json(
        createFeatureGateError("production", "Wholesale Invoices"),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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
    if (status) {
      where.status = status;
    }
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate);
      }
    }

    const invoices = await prisma.wholesaleInvoice.findMany({
      where,
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
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serialize Decimal fields
    const serialized = invoices.map((invoice) => ({
      ...invoice,
      subtotal: invoice.subtotal.toString(),
      taxRate: invoice.taxRate.toString(),
      taxAmount: invoice.taxAmount.toString(),
      total: invoice.total.toString(),
      creditLimit: invoice.customer.creditLimit?.toString(),
      paidAmount: invoice.paidAmount?.toString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    logger.error("Failed to fetch invoices", error, "Wholesale/Invoices");
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
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
        createFeatureGateError("production", "Wholesale Invoices"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      customerId,
      companyId,
      issueDate,
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes,
    } = body;

    if (!customerId || !companyId || !subtotal || !total) {
      return NextResponse.json(
        { error: "customerId, companyId, subtotal, and total are required" },
        { status: 400 }
      );
    }

    const parsedCompanyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;
    const parsedCustomerId = typeof customerId === 'string' ? parseInt(customerId) : customerId;

    const hasCompany = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasCompany) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Verify customer exists
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { id: parsedCustomerId },
      select: { paymentTerms: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate due date from payment terms if not provided
    let calculatedDueDate = dueDate ? new Date(dueDate) : new Date();
    if (!dueDate && customer.paymentTerms) {
      // Parse payment terms like "Net 30" or "Net 7"
      const netMatch = customer.paymentTerms.match(/Net\s+(\d+)/i);
      if (netMatch) {
        const days = parseInt(netMatch[1]);
        calculatedDueDate = addDays(new Date(issueDate || new Date()), days);
      }
    }

    const invoiceNumber = await generateInvoiceNumber(parsedCompanyId);

    const invoice = await prisma.wholesaleInvoice.create({
      data: {
        invoiceNumber,
        orderId: orderId ? parseInt(orderId) : null,
        customerId: parsedCustomerId,
        companyId: parsedCompanyId,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: calculatedDueDate,
        subtotal: parseFloat(subtotal),
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
        total: parseFloat(total),
        status: "draft",
        notes,
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
      where: { id: parsedCustomerId },
      data: {
        outstandingBalance: {
          increment: parseFloat(total),
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
    logger.error("Failed to create invoice", error, "Wholesale/Invoices");
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

