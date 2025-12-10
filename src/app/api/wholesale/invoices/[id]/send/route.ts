import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";
import { generateInvoiceEmailHTML, generateInvoiceEmailText } from "@/lib/email-templates/invoice";

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

    const invoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        order: {
          include: {
            items: {
              include: {
                recipe: true,
              },
            },
          },
        },
        Company: {
          select: {
            name: true,
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

    if (!invoice.customer.email) {
      return NextResponse.json(
        { error: "Customer does not have an email address" },
        { status: 400 }
      );
    }

    // Generate invoice URL
    const invoiceUrl = `${request.nextUrl.origin}/api/wholesale/invoices/${invoiceId}/pdf`;

    // Generate email content
    const emailData = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      total: Number(invoice.total),
      invoiceUrl,
      companyName: invoice.Company.name,
    };

    const html = generateInvoiceEmailHTML(emailData);
    const text = generateInvoiceEmailText(emailData);

    // Send email
    try {
      await sendEmail(
        invoice.customer.email,
        `Invoice ${invoice.invoiceNumber} from ${invoice.Company.name}`,
        html
      );

      // Mark as sent
      await prisma.wholesaleInvoice.update({
        where: { id: invoiceId },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
          status: invoice.status === "draft" ? "sent" : invoice.status,
        },
      });

      logger.info(`Invoice ${invoice.invoiceNumber} email sent to ${invoice.customer.email}`, "Wholesale/Invoices");

      return NextResponse.json({ success: true, message: "Invoice email sent" });
    } catch (emailError) {
      logger.error("Failed to send invoice email", emailError, "Wholesale/Invoices");
      return NextResponse.json(
        { error: "Failed to send email. Please check your email configuration." },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Failed to send invoice email", error, "Wholesale/Invoices");
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
}

