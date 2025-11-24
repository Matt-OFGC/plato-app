import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customerId = parseInt(id);
    const body = await request.json();
    const {
      name,
      contactName,
      email,
      phone,
      address,
      city,
      postcode,
      country,
      notes,
      isActive,
    } = body;

    // Verify customer exists and user has access
    const existingCustomer = await prisma.wholesaleCustomer.findUnique({
      where: { id: customerId },
      select: { companyId: true },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, existingCustomer.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this customer" },
        { status: 403 }
      );
    }

    const customer = await prisma.wholesaleCustomer.update({
      where: { id: customerId },
      data: {
        name,
        contactName,
        email,
        phone,
        address,
        city,
        postcode,
        country,
        notes,
        isActive,
      },
      include: {
        _count: {
          select: {
            productionItems: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    logger.error("Update wholesale customer error", error, "Wholesale/Customers");
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = parseInt(params.id);

    // Verify customer exists and user has access
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { id: customerId },
      select: { companyId: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, customer.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this customer" },
        { status: 403 }
      );
    }

    await prisma.wholesaleCustomer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete wholesale customer error", error, "Wholesale/Customers");
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}

