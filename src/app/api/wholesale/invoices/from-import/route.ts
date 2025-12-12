import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";

interface ImportedInvoiceData {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const data: ImportedInvoiceData = await request.json();

    // Validate required fields
    if (!data.customerName || !data.invoiceNumber) {
      return NextResponse.json(
        { error: "Customer name and invoice number are required" },
        { status: 400 }
      );
    }

    // Check if invoice number already exists for this company
    const existingInvoice = await prisma.wholesaleInvoice.findFirst({
      where: {
        invoiceNumber: data.invoiceNumber,
        companyId,
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: `Invoice ${data.invoiceNumber} already exists` },
        { status: 400 }
      );
    }

    // Try to find existing customer by name (case-insensitive)
    let customer = await prisma.wholesaleCustomer.findFirst({
      where: {
        companyId,
        name: {
          equals: data.customerName,
          mode: "insensitive",
        },
      },
    });

    // If customer doesn't exist, create them
    if (!customer) {
      customer = await prisma.wholesaleCustomer.create({
        data: {
          companyId,
          name: data.customerName,
          email: "", // Will need to be filled in later
          contactName: data.customerName,
        },
      });
    }

    // Calculate tax rate if tax amount is provided
    const taxRate = data.subtotal > 0 ? (data.tax / data.subtotal) * 100 : 0;

    // Create the invoice
    const invoice = await prisma.wholesaleInvoice.create({
      data: {
        companyId,
        customerId: customer.id,
        invoiceNumber: data.invoiceNumber,
        issueDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        subtotal: data.subtotal,
        taxRate,
        taxAmount: data.tax,
        total: data.total,
        status: "sent", // Imported invoices are already sent
        notes: data.notes ? `IMPORTED INVOICE\n\nLine Items:\n${data.items.map(item => `- ${item.description} (${item.quantity} × £${item.unitPrice.toFixed(2)} = £${item.total.toFixed(2)})`).join('\n')}\n\n${data.notes}` : `IMPORTED INVOICE\n\nLine Items:\n${data.items.map(item => `- ${item.description} (${item.quantity} × £${item.unitPrice.toFixed(2)} = £${item.total.toFixed(2)})`).join('\n')}`,
      },
      include: {
        WholesaleCustomer: true,
      },
    });

    return NextResponse.json({
      success: true,
      invoice,
      customer,
      isNewCustomer: !existingInvoice,
    });
  } catch (error: any) {
    console.error("Invoice import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
