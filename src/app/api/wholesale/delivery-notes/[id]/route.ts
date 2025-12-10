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
    const deliveryNoteId = parseInt(id);

    const deliveryNote = await prisma.wholesaleDeliveryNote.findUnique({
      where: { id: deliveryNoteId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return NextResponse.json(deliveryNote);
  } catch (error) {
    logger.error("Failed to fetch delivery note", error, "Wholesale/DeliveryNotes");
    return NextResponse.json(
      { error: "Failed to fetch delivery note" },
      { status: 500 }
    );
  }
}

