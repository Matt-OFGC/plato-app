import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";
import { generateDeliveryNoteEmailHTML, generateDeliveryNoteEmailText } from "@/lib/email-templates/delivery-note";

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
    const deliveryNoteId = parseInt(id);

    const deliveryNote = await prisma.wholesaleDeliveryNote.findUnique({
      where: { id: deliveryNoteId },
      include: {
        customer: true,
        order: {
          select: {
            orderNumber: true,
          },
        },
        Company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!deliveryNote) {
      return NextResponse.json({ error: "Delivery note not found" }, { status: 404 });
    }

    const hasAccess = await hasCompanyAccess(session.id, deliveryNote.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this delivery note" },
        { status: 403 }
      );
    }

    if (!deliveryNote.customer.email) {
      return NextResponse.json(
        { error: "Customer does not have an email address" },
        { status: 400 }
      );
    }

    // Generate delivery note URL
    const deliveryNoteUrl = `${request.nextUrl.origin}/api/wholesale/delivery-notes/${deliveryNoteId}/pdf`;

    // Generate email content
    const emailData = {
      deliveryNoteNumber: deliveryNote.deliveryNoteNumber,
      customerName: deliveryNote.customer.name,
      deliveryDate: deliveryNote.deliveryDate,
      orderNumber: deliveryNote.order.orderNumber,
      deliveryNoteUrl,
      companyName: deliveryNote.Company.name,
    };

    const html = generateDeliveryNoteEmailHTML(emailData);
    const text = generateDeliveryNoteEmailText(emailData);

    // Send email
    try {
      await sendEmail(
        deliveryNote.customer.email,
        `Delivery Note ${deliveryNote.deliveryNoteNumber} from ${deliveryNote.Company.name}`,
        html
      );

      // Mark as sent
      await prisma.wholesaleDeliveryNote.update({
        where: { id: deliveryNoteId },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });

      logger.info(`Delivery note ${deliveryNote.deliveryNoteNumber} email sent to ${deliveryNote.customer.email}`, "Wholesale/DeliveryNotes");

      return NextResponse.json({ success: true, message: "Delivery note email sent" });
    } catch (emailError) {
      logger.error("Failed to send delivery note email", emailError, "Wholesale/DeliveryNotes");
      return NextResponse.json(
        { error: "Failed to send email. Please check your email configuration." },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Failed to send delivery note email", error, "Wholesale/DeliveryNotes");
    return NextResponse.json(
      { error: "Failed to send delivery note email" },
      { status: 500 }
    );
  }
}

