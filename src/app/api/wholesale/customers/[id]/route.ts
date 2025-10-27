import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

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
    console.error("Update wholesale customer error:", error);
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

    await prisma.wholesaleCustomer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wholesale customer error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}

