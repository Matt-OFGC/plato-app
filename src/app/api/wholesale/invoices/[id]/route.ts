import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-simple";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoiceId = parseInt(params.id, 10);
    if (Number.isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }

    const invoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        company: true,
        order: {
          include: {
            items: {
              include: {
                recipe: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const allowed = await hasCompanyAccess(session.id, invoice.companyId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(invoice);
  } catch (error) {
    logger.error("Invoice GET failed", error, "Wholesale/Invoices");
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoiceId = parseInt(params.id, 10);
    if (Number.isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.wholesaleInvoice.findUnique({
      where: { id: invoiceId },
      select: { companyId: true },
    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const allowed = await hasCompanyAccess(session.id, existing.companyId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const {
      paymentTerms,
      dueDate,
      purchaseOrderNumber,
      notes,
      status,
      paidDate,
      paidAmount,
    } = body || {};

    const updated = await prisma.wholesaleInvoice.update({
      where: { id: invoiceId },
      data: {
        paymentTerms: paymentTerms ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        purchaseOrderNumber: purchaseOrderNumber ?? null,
        notes: notes ?? null,
        status: status || undefined,
        paidDate: paidDate ? new Date(paidDate) : undefined,
        paidAmount: paidAmount ?? undefined,
      },
      include: {
        customer: true,
        company: true,
        order: {
          include: {
            items: {
              include: {
                recipe: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Invoice update failed", error, "Wholesale/Invoices");
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoiceId = parseInt(params.id, 10);
    if (Number.isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }

    const existing = await prisma.wholesaleInvoice.findUnique({
      where: { id: invoiceId },
      select: { companyId: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const allowed = await hasCompanyAccess(session.id, existing.companyId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.wholesaleInvoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Invoice delete failed", error, "Wholesale/Invoices");
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
