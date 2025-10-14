import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateOrderStatusEmail } from "@/lib/email";

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
    const orderId = parseInt(id);

    const order = await prisma.wholesaleOrder.findUnique({
      where: { id: orderId },
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Get wholesale order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

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
    const orderId = parseInt(id);
    const body = await request.json();
    const { 
      status, 
      deliveryDate, 
      notes, 
      items,
      isRecurring,
      recurringInterval,
      recurringIntervalDays,
      recurringEndDate,
      recurringStatus,
      nextRecurrenceDate,
    } = body;

    // Get existing order to check if status changed
    const existingOrder = await prisma.wholesaleOrder.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    const statusChanged = status && existingOrder && status !== existingOrder.status;

    // If items are provided, update them
    if (items) {
      // Delete existing items and create new ones
      await prisma.wholesaleOrderItem.deleteMany({
        where: { orderId },
      });

      await prisma.wholesaleOrderItem.createMany({
        data: items.map((item: any) => ({
          orderId,
          recipeId: item.recipeId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
        })),
      });
    }

    const order = await prisma.wholesaleOrder.update({
      where: { id: orderId },
      data: {
        ...(status !== undefined && { status }),
        ...(deliveryDate !== undefined && {
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        }),
        ...(notes !== undefined && { notes }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurringInterval !== undefined && { recurringInterval }),
        ...(recurringIntervalDays !== undefined && { recurringIntervalDays }),
        ...(recurringEndDate !== undefined && {
          recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null,
        }),
        ...(recurringStatus !== undefined && { recurringStatus }),
        ...(nextRecurrenceDate !== undefined && {
          nextRecurrenceDate: nextRecurrenceDate ? new Date(nextRecurrenceDate) : null,
        }),
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

    // Send status update email if status changed
    if (statusChanged && order.customer.email) {
      try {
        const company = await prisma.company.findUnique({
          where: { id: order.companyId },
          select: { name: true },
        });

        const emailContent = generateOrderStatusEmail({
          orderNumber: order.id.toString(),
          customer: {
            name: order.customer.name,
          },
          company: {
            name: company?.name || "Plato",
          },
          status: order.status,
          items: order.items,
        });

        await sendEmail({
          to: order.customer.email,
          subject: `Order Update #${order.id}`,
          html: emailContent.html,
          text: emailContent.text,
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
    }

    // If order was just marked as delivered, deduct from inventory
    if (status === "delivered" && existingOrder && existingOrder.status !== "delivered") {
      try {
        // Deduct each item from inventory
        for (const item of order.items) {
          const totalQuantity = item.quantity * parseFloat(item.recipe.yieldQuantity);
          
          await prisma.inventory.upsert({
            where: {
              companyId_recipeId: {
                companyId: order.companyId,
                recipeId: item.recipeId,
              },
            },
            create: {
              companyId: order.companyId,
              recipeId: item.recipeId,
              quantity: -totalQuantity, // Negative stock (will need adjustment)
              unit: item.recipe.yieldUnit,
              movements: {
                create: {
                  type: "sale",
                  quantity: -totalQuantity,
                  orderId: orderId,
                  reason: `Delivered to ${order.customer.name}`,
                  createdBy: session.id,
                },
              },
            },
            update: {
              quantity: {
                decrement: totalQuantity,
              },
              movements: {
                create: {
                  type: "sale",
                  quantity: -totalQuantity,
                  orderId: orderId,
                  reason: `Delivered to ${order.customer.name}`,
                  createdBy: session.id,
                },
              },
            },
          });
        }
      } catch (inventoryError) {
        console.error("Failed to update inventory on delivery:", inventoryError);
        // Don't fail the order update if inventory fails
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Update wholesale order error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    await prisma.wholesaleOrder.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wholesale order error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

