import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { canAccessWholesale, createFeatureGateError } from "@/lib/subscription";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";

// Generate next delivery note number
async function generateDeliveryNoteNumber(companyId: number): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DN-${year}-`;
  
  const lastNote = await prisma.wholesaleDeliveryNote.findFirst({
    where: {
      companyId,
      deliveryNoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      deliveryNoteNumber: "desc",
    },
  });

  if (!lastNote) {
    return `${prefix}001`;
  }

  const lastNumber = parseInt(lastNote.deliveryNoteNumber.replace(prefix, ""));
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
        createFeatureGateError("production", "Wholesale Delivery Notes"),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const customerId = searchParams.get("customerId");
    const orderId = searchParams.get("orderId");

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
    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    const deliveryNotes = await prisma.wholesaleDeliveryNote.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(deliveryNotes);
  } catch (error) {
    logger.error("Failed to fetch delivery notes", error, "Wholesale/DeliveryNotes");
    return NextResponse.json(
      { error: "Failed to fetch delivery notes" },
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
        createFeatureGateError("production", "Wholesale Delivery Notes"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      customerId,
      companyId,
      deliveryDate,
      deliveredBy,
      signature,
      notes,
    } = body;

    if (!orderId || !customerId || !companyId || !deliveryDate) {
      return NextResponse.json(
        { error: "orderId, customerId, companyId, and deliveryDate are required" },
        { status: 400 }
      );
    }

    const parsedCompanyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;
    const parsedCustomerId = typeof customerId === 'string' ? parseInt(customerId) : customerId;
    const parsedOrderId = typeof orderId === 'string' ? parseInt(orderId) : orderId;

    const hasCompany = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasCompany) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    const deliveryNoteNumber = await generateDeliveryNoteNumber(parsedCompanyId);

    const deliveryNote = await prisma.wholesaleDeliveryNote.create({
      data: {
        deliveryNoteNumber,
        orderId: parsedOrderId,
        customerId: parsedCustomerId,
        companyId: parsedCompanyId,
        deliveryDate: new Date(deliveryDate),
        deliveredBy,
        signature,
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

    return NextResponse.json(deliveryNote);
  } catch (error) {
    logger.error("Failed to create delivery note", error, "Wholesale/DeliveryNotes");
    return NextResponse.json(
      { error: "Failed to create delivery note" },
      { status: 500 }
    );
  }
}

