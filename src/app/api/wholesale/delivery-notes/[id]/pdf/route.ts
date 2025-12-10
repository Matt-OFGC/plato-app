import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { generateDeliveryNoteHTML } from "@/lib/delivery-note-generator";

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
    const deliveryNoteId = parseInt(id);

    const deliveryNote = await prisma.wholesaleDeliveryNote.findUnique({
      where: { id: deliveryNoteId },
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
        Company: {
          select: {
            name: true,
            address: true,
            city: true,
            postcode: true,
            country: true,
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

    const items = deliveryNote.order.items.map(item => ({
      name: item.recipe.name,
      quantity: item.quantity,
      unit: item.recipe.yieldUnit,
      description: `${item.recipe.yieldQuantity} ${item.recipe.yieldUnit} per batch`,
    }));

    const deliveryNoteData = {
      deliveryNoteNumber: deliveryNote.deliveryNoteNumber,
      deliveryDate: deliveryNote.deliveryDate,
      orderNumber: deliveryNote.order.orderNumber,
      customer: {
        name: deliveryNote.customer.name,
        address: deliveryNote.customer.address,
        city: deliveryNote.customer.city,
        postcode: deliveryNote.customer.postcode,
        country: deliveryNote.customer.country,
      },
      company: {
        name: deliveryNote.Company.name,
        address: deliveryNote.Company.address,
        city: deliveryNote.Company.city,
        postcode: deliveryNote.Company.postcode,
        country: deliveryNote.Company.country,
      },
      items,
      deliveredBy: deliveryNote.deliveredBy,
      notes: deliveryNote.notes,
    };

    const html = generateDeliveryNoteHTML(deliveryNoteData);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="delivery-note-${deliveryNote.deliveryNoteNumber}.html"`,
      },
    });
  } catch (error) {
    logger.error("Failed to generate delivery note PDF", error, "Wholesale/DeliveryNotes");
    return NextResponse.json(
      { error: "Failed to generate delivery note PDF" },
      { status: 500 }
    );
  }
}

