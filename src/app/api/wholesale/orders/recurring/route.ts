import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// GET /api/wholesale/orders/recurring - Get all recurring orders for a company
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const customerId = searchParams.get("customerId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const where: any = {
      companyId: parseInt(companyId),
      isRecurring: true,
      parentOrderId: null, // Only get parent orders, not auto-generated ones
    };

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    const orders = await prisma.wholesaleOrder.findMany({
      where,
      include: {
        customer: true,
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
        _count: {
          select: {
            recurringOrders: true, // Count how many times this has been repeated
          },
        },
      },
      orderBy: [
        { recurringStatus: "asc" },
        { nextRecurrenceDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Serialize Decimal fields
    const serializedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        price: item.price ? item.price.toString() : null,
        recipe: {
          ...item.recipe,
          yieldQuantity: item.recipe.yieldQuantity.toString(),
        },
      })),
    }));

    return NextResponse.json(serializedOrders);
  } catch (error) {
    console.error("Get recurring orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring orders" },
      { status: 500 }
    );
  }
}

// POST /api/wholesale/orders/recurring/generate - Manually trigger recurring order generation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Get the parent order
    const parentOrder = await prisma.wholesaleOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: true,
      },
    });

    if (!parentOrder || !parentOrder.isRecurring) {
      return NextResponse.json(
        { error: "Order not found or not a recurring order" },
        { status: 404 }
      );
    }

    // Generate the next order
    const newOrder = await generateNextRecurringOrder(parentOrder);

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("Generate recurring order error:", error);
    return NextResponse.json(
      { error: "Failed to generate recurring order" },
      { status: 500 }
    );
  }
}

// Helper function to generate the next recurring order
async function generateNextRecurringOrder(parentOrder: any) {
  // Calculate next delivery date
  let nextDeliveryDate = new Date();
  if (parentOrder.deliveryDate) {
    nextDeliveryDate = new Date(parentOrder.deliveryDate);
  }

  // Add interval days
  if (parentOrder.recurringInterval === "weekly") {
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
  } else if (parentOrder.recurringInterval === "biweekly") {
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 14);
  } else if (parentOrder.recurringInterval === "monthly") {
    nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
  } else if (parentOrder.recurringIntervalDays) {
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + parentOrder.recurringIntervalDays);
  }

  // Create the new order
  const newOrder = await prisma.wholesaleOrder.create({
    data: {
      customerId: parentOrder.customerId,
      companyId: parentOrder.companyId,
      deliveryDate: nextDeliveryDate,
      status: "pending",
      notes: `Auto-generated from recurring order #${parentOrder.id}`,
      isRecurring: false, // The generated orders are not themselves recurring
      parentOrderId: parentOrder.id,
      items: {
        create: parentOrder.items.map((item: any) => ({
          recipeId: item.recipeId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
        })),
      },
    },
    include: {
      customer: true,
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
  });

  // Update parent order's next recurrence date
  const nextRecurrenceDate = new Date(nextDeliveryDate);
  if (parentOrder.recurringInterval === "weekly") {
    nextRecurrenceDate.setDate(nextRecurrenceDate.getDate() + 7);
  } else if (parentOrder.recurringInterval === "biweekly") {
    nextRecurrenceDate.setDate(nextRecurrenceDate.getDate() + 14);
  } else if (parentOrder.recurringInterval === "monthly") {
    nextRecurrenceDate.setMonth(nextRecurrenceDate.getMonth() + 1);
  } else if (parentOrder.recurringIntervalDays) {
    nextRecurrenceDate.setDate(nextRecurrenceDate.getDate() + parentOrder.recurringIntervalDays);
  }

  await prisma.wholesaleOrder.update({
    where: { id: parentOrder.id },
    data: {
      nextRecurrenceDate,
    },
  });

  return newOrder;
}

