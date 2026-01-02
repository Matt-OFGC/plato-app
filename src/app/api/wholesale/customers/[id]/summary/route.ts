import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { hasCompanyAccess } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const customerId = Number(resolvedParams.id);
    if (Number.isNaN(customerId)) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    // Find the company for this customer (and ensure it exists)
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { id: customerId },
      select: { companyId: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const allowed = await hasCompanyAccess(session.id, customer.companyId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [orders, invoices] = await Promise.all([
      prisma.wholesaleOrder.findMany({
        where: { customerId, companyId: customer.companyId },
        select: { id: true, deliveryDate: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.wholesaleInvoice.findMany({
        where: { customerId, companyId: customer.companyId },
        select: {
          id: true,
          total: true,
          paidAmount: true,
          status: true,
          issueDate: true,
          dueDate: true,
          paidDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const orderCount = orders.length;
    const lastOrderDate = orders[0]?.deliveryDate ?? orders[0]?.createdAt ?? null;

    let totalInvoiced = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let lastInvoiceDate: Date | null = null;
    let draftCount = 0;
    let sentCount = 0;
    let paidCount = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      const total = Number(inv.total || 0);
      const paid = Number(inv.paidAmount || 0);
      totalInvoiced += total;
      totalPaid += paid;
      if (inv.status === "paid") {
        paidCount += 1;
      } else {
        outstanding += total - paid;
        if (inv.status === "sent") sentCount += 1;
        if (inv.status === "draft") draftCount += 1;
        if (inv.status === "overdue") overdueCount += 1;
      }
      const issuedAt = inv.issueDate || inv.createdAt;
      if (!lastInvoiceDate || (issuedAt && issuedAt > lastInvoiceDate)) {
        lastInvoiceDate = issuedAt ?? lastInvoiceDate;
      }
    }

    const invoiceCount = invoices.length;
    const avgInvoiceValue = invoiceCount > 0 ? totalInvoiced / invoiceCount : 0;

    return NextResponse.json({
      customerId,
      orderCount,
      invoiceCount,
      totals: {
        totalInvoiced,
        totalPaid,
        outstanding: Math.max(outstanding, 0),
        averageInvoice: avgInvoiceValue,
      },
      counts: {
        paid: paidCount,
        sent: sentCount,
        draft: draftCount,
        overdue: overdueCount,
      },
      lastOrderDate,
      lastInvoiceDate,
    });
  } catch (error) {
    logger.error("Wholesale customer summary failed", error, "Wholesale/Customers");
    return NextResponse.json({ error: "Failed to load customer summary" }, { status: 500 });
  }
}

