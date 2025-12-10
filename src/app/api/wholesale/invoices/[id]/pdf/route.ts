import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { generateInvoiceHTML } from "@/lib/invoice-generator";

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
                    wholesalePrice: true,
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
        },
        company: {
          select: {
            name: true,
            address: true,
            city: true,
            postcode: true,
            country: true,
            email: true,
            phone: true,
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

    // Get invoice items from order with wholesale prices
    const items = invoice.order?.items.map(item => {
      // Use order item price if set, otherwise use recipe wholesale price
      let unitPrice = item.price ? Number(item.price) : 0;
      if (!unitPrice && item.recipe.wholesalePrice) {
        unitPrice = Number(item.recipe.wholesalePrice);
      }
      return {
        name: item.recipe.name,
        quantity: item.quantity,
        unitPrice: unitPrice,
        total: unitPrice * item.quantity,
        description: `${item.recipe.yieldQuantity} ${item.recipe.yieldUnit}`,
      };
    }) || [];

    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      customer: {
        name: invoice.customer.name,
        address: invoice.customer.address,
        city: invoice.customer.city,
        postcode: invoice.customer.postcode,
        country: invoice.customer.country,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
        taxId: invoice.customer.taxId,
      },
      company: {
        name: invoice.company.name,
        address: invoice.company.address,
        city: invoice.company.city,
        postcode: invoice.company.postcode,
        country: invoice.company.country,
        email: invoice.company.email,
        phone: invoice.company.phone,
      },
      items,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      notes: invoice.notes,
      paymentTerms: invoice.customer.paymentTerms,
    };

    const html = generateInvoiceHTML(invoiceData);

    // Return HTML that can be printed or converted to PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    logger.error("Failed to generate invoice PDF", error, "Wholesale/Invoices");
    return NextResponse.json(
      { error: "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}

