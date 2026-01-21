import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateOrderStatusEmail } from "@/lib/email";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

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
      select: {
        id: true,
        companyId: true,
        customer: true,
        items: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                yieldQuantity: true,
                yieldUnit: true,
                shelfLifeDays: true,
              },
            },
          },
        },
      },
    });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, order.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this order" },
        { status: 403 }
      );
    }

    // Re-fetch with full data after authorization check
    const fullOrder = await prisma.wholesaleOrder.findUnique({
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

    return createOptimizedResponse(fullOrder, {
      cacheType: 'dynamic',
      compression: true,
    });
  } catch (error) {
    logger.error("Get wholesale order error", error, "Wholesale/Orders");
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

    // Get existing order to check if status changed and verify access
    const existingOrder = await prisma.wholesaleOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        companyId: true,
        status: true,
        customer: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, existingOrder.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this order" },
        { status: 403 }
      );
    }

    const statusChanged = status && status !== existingOrder.status;

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
                shelfLifeDays: true,
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
        logger.error("Failed to send status update email", emailError, "Wholesale/Orders");
      }
    }

    // If order was just marked as delivered, deduct from inventory and create customer-facing inventory (idempotent)
    if (status === "delivered" && existingOrder && existingOrder.status !== "delivered") {
      try {
        const now = new Date();

        const existingCustomerInventory = await prisma.customerInventory.count({
          where: { orderId: order.id },
        });

        if (existingCustomerInventory === 0) {
          await prisma.$transaction(
            order.items.map((item, idx) => {
              const shelfLifeDays = item.recipe?.shelfLifeDays ?? 5;
              const expiryDate = new Date(now);
              expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
              const namePrefix = (item.recipe?.name || "XX")
                .slice(0, 2)
                .toUpperCase();
              const batchId = `${namePrefix}-${now
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, "")}-${(idx + 1)
                .toString()
                .padStart(3, "0")}`;

              return prisma.customerInventory.create({
                data: {
                  customerId: order.customerId,
                  orderId: order.id,
                  recipeId: item.recipeId,
                  productionItemId: null,
                  batchId,
                  deliveryDate: now,
                  expiryDate,
                  originalQuantity: item.quantity,
                  currentStock: item.quantity,
                  status: "ACTIVE",
                },
              });
            })
          );
        }

        // Deduct each item from company inventory
        for (const item of order.items) {
          const yieldQuantity = Number(item.recipe?.yieldQuantity ?? 1);
          const safeYieldQuantity =
            Number.isFinite(yieldQuantity) && yieldQuantity > 0 ? yieldQuantity : 1;
          const totalQuantity = item.quantity * safeYieldQuantity;
          
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
        logger.error("Failed to update inventory on delivery", inventoryError, "Wholesale/Orders");
        // Don't fail the order update if inventory fails
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    logger.error("Update wholesale order error", error, "Wholesale/Orders");
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

    // Verify order exists and user has access
    const order = await prisma.wholesaleOrder.findUnique({
      where: { id: orderId },
      select: { companyId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, order.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this order" },
        { status: 403 }
      );
    }

    await prisma.wholesaleOrder.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete wholesale order error", error, "Wholesale/Orders");
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

