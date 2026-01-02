import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateOrderConfirmationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

function isWorkingDay(date: Date) {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Mon-Fri
}

function addWorkingDays(start: Date, workingDays: number) {
  const d = new Date(start);
  let remaining = workingDays;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d)) {
      remaining -= 1;
    }
  }
  return d;
}

function computeEarliestDelivery(now: Date) {
  const start = new Date(now);
  if (start.getHours() >= 12) {
    start.setDate(start.getDate() + 1);
  }
  // Move to next working day if today/tomorrow is weekend
  while (!isWorkingDay(start)) {
    start.setDate(start.getDate() + 1);
  }
  start.setHours(0, 0, 0, 0);
  const earliest = addWorkingDays(start, 4);
  earliest.setHours(0, 0, 0, 0);
  return earliest;
}

// Create order from customer portal (no authentication required, uses token)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Verify customer and portal access
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { portalToken: token },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid portal token" },
        { status: 404 }
      );
    }

    if (!customer.portalEnabled) {
      return NextResponse.json(
        { error: "Portal access is disabled" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { deliveryDate, notes, items, isRecurring, recurringInterval } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    if (!deliveryDate) {
      return NextResponse.json(
        { error: "Delivery date is required" },
        { status: 400 }
      );
    }

    const requestedDelivery = new Date(deliveryDate);
    const earliest = computeEarliestDelivery(new Date());
    const requestedAtMidnight = new Date(requestedDelivery);
    requestedAtMidnight.setHours(0, 0, 0, 0);

    if (requestedAtMidnight < earliest) {
      return NextResponse.json(
        { error: `Earliest available delivery is ${earliest.toLocaleDateString()}` },
        { status: 400 }
      );
    }

    // Calculate next recurrence date if this is a recurring order
    let nextRecurrenceDate = null;
    if (isRecurring && deliveryDate) {
      const delivery = new Date(deliveryDate);
      if (recurringInterval === "weekly") {
        nextRecurrenceDate = new Date(delivery);
        nextRecurrenceDate.setDate(nextRecurrenceDate.getDate() + 7);
      } else if (recurringInterval === "biweekly") {
        nextRecurrenceDate = new Date(delivery);
        nextRecurrenceDate.setDate(nextRecurrenceDate.getDate() + 14);
      } else if (recurringInterval === "monthly") {
        nextRecurrenceDate = new Date(delivery);
        nextRecurrenceDate.setMonth(nextRecurrenceDate.getMonth() + 1);
      }
    }

    // Create the order
    const order = await prisma.wholesaleOrder.create({
      data: {
        customerId: customer.id,
        companyId: customer.companyId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        status: "pending",
        notes,
        isRecurring: isRecurring || false,
        recurringInterval: isRecurring ? recurringInterval : null,
        recurringStatus: isRecurring ? "active" : null,
        nextRecurrenceDate,
        items: {
          create: items.map((item: any) => ({
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

    // Send notification to company users about new order
    try {
      // Get all active company members
      const companyMembers = await prisma.membership.findMany({
        where: {
          companyId: customer.companyId,
          isActive: true,
          role: { in: ["OWNER", "ADMIN", "EDITOR"] }, // Only notify admins and editors
        },
        select: { userId: true },
      });

      // Create notifications for each member
      if (companyMembers.length > 0) {
        await prisma.notification.createMany({
          data: companyMembers.map(member => ({
            userId: member.userId,
            type: "wholesale_order",
            title: "New Wholesale Order",
            message: `${customer.name} placed an order with ${items.length} item${items.length !== 1 ? 's' : ''}`,
            link: `/dashboard/wholesale/orders`,
          })),
        });
      }
    } catch (notificationError) {
      // Log error but don't fail the order
      logger.error("Failed to create notifications", notificationError, "Wholesale/Portal");
    }

    // Auto-sync to production plan if delivery date is within the next 14 days
    if (deliveryDate) {
      try {
        const delivery = new Date(deliveryDate);
        const now = new Date();
        const daysUntilDelivery = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // If delivery is within 14 days, find or create a production plan for that week
        if (daysUntilDelivery >= 0 && daysUntilDelivery <= 14) {
          // Get the start of the week for the delivery date (Monday)
          const weekStart = new Date(delivery);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
          weekStart.setDate(diff);
          weekStart.setHours(0, 0, 0, 0);
          
          // Get the end of the week (Sunday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          // Find existing production plan for this week
          let productionPlan = await prisma.productionPlan.findFirst({
            where: {
              companyId: customer.companyId,
              startDate: { lte: weekEnd },
              endDate: { gte: weekStart },
            },
          });
          
          // Create production plan if it doesn't exist
          if (!productionPlan) {
            productionPlan = await prisma.productionPlan.create({
              data: {
                companyId: customer.companyId,
                name: `Week of ${weekStart.toLocaleDateString()}`,
                startDate: weekStart,
                endDate: weekEnd,
                notes: "Auto-created from wholesale orders",
                createdBy: 1, // System user
              },
            });
          }
          
          // Add order items to production plan
          for (const item of order.items) {
            // Get recipe to calculate batches needed
            const recipe = await prisma.recipe.findUnique({
              where: { id: item.recipeId },
              select: { yieldQuantity: true },
            });

            // Calculate batches needed: ordered quantity / yield per batch
            // e.g., 48 slices ordered / 24 slices per batch = 2 batches
            const batchesNeeded = recipe 
              ? Math.ceil(item.quantity / Number(recipe.yieldQuantity))
              : item.quantity;

            await prisma.productionItem.create({
              data: {
                planId: productionPlan.id,
                recipeId: item.recipeId,
                quantity: batchesNeeded,
                customerId: customer.id,
                notes: `Wholesale order #${order.id} for ${customer.name} - ${item.quantity} units ordered (${batchesNeeded} batches)`,
                allocations: {
                  create: {
                    customerId: customer.id,
                    destination: "wholesale",
                    quantity: batchesNeeded,
                    notes: `Order #${order.id} - ${item.quantity} units`,
                  },
                },
              },
            });
          }
        }
      } catch (productionError) {
        // Log error but don't fail the order
        logger.error("Failed to sync to production plan", productionError, "Wholesale/Portal");
      }
    }

    // Send confirmation email to customer
    if (customer.email) {
      try {
        const company = await prisma.company.findUnique({
          where: { id: customer.companyId },
          select: { name: true },
        });

        const emailContent = generateOrderConfirmationEmail({
          orderNumber: order.id.toString(),
          customer: {
            name: customer.name,
            email: customer.email,
          },
          company: {
            name: company?.name || "Plato",
          },
          items: order.items,
          deliveryDate: order.deliveryDate || undefined,
          notes: order.notes || undefined,
        });

        await sendEmail({
          to: customer.email,
          subject: `Order Confirmation #${order.id}`,
          html: emailContent.html,
          text: emailContent.text,
        });
      } catch (emailError) {
        // Log error but don't fail the order
        logger.error("Failed to send confirmation email", emailError, "Wholesale/Portal");
      }
    }

    return NextResponse.json({
      success: true,
      order,
      message: "Order submitted successfully",
    });
  } catch (error) {
    logger.error("Create portal order error", error, "Wholesale/Portal");
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

