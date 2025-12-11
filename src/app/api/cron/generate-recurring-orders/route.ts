import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Cron job endpoint to automatically generate recurring orders
 * This should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions, or external cron)
 * 
 * To set up with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-recurring-orders",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-key";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Find all active recurring orders where nextRecurrenceDate is today or earlier
    const recurringOrders = await prisma.wholesaleOrder.findMany({
      where: {
        isRecurring: true,
        recurringStatus: "active",
        nextRecurrenceDate: {
          lte: today,
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    const generated: any[] = [];
    const errors: any[] = [];

    for (const parentOrder of recurringOrders) {
      try {
        // Check if we've passed the end date
        if (parentOrder.recurringEndDate && new Date(parentOrder.recurringEndDate) < today) {
          // Mark as cancelled if past end date
          await prisma.wholesaleOrder.update({
            where: { id: parentOrder.id },
            data: { recurringStatus: "cancelled" },
          });
          continue;
        }

        // Calculate next delivery date based on interval
        let nextDeliveryDate = new Date(parentOrder.nextRecurrenceDate!);
        
        // Create the new order
        const newOrder = await prisma.wholesaleOrder.create({
          data: {
            customerId: parentOrder.customerId,
            companyId: parentOrder.companyId,
            deliveryDate: nextDeliveryDate,
            status: "pending",
            notes: `Auto-generated from recurring order #${parentOrder.id}${parentOrder.notes ? ` - ${parentOrder.notes}` : ''}`,
            isRecurring: false, // Generated orders are not themselves recurring
            parentOrderId: parentOrder.id,
            items: {
              create: parentOrder.items.map((item) => ({
                recipeId: item.recipeId,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes,
              })),
            },
          },
          include: {
            customer: true,
            items: true,
          },
        });

        // Calculate next recurrence date
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

        // Update parent order's next recurrence date
        await prisma.wholesaleOrder.update({
          where: { id: parentOrder.id },
          data: { nextRecurrenceDate },
        });

        // Auto-sync to production plan if delivery date is within 14 days
        const daysUntilDelivery = Math.ceil((nextDeliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDelivery >= 0 && daysUntilDelivery <= 14) {
          try {
            // Get or create production plan for the week
            const weekStart = new Date(nextDeliveryDate);
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            let productionPlan = await prisma.productionPlan.findFirst({
              where: {
                companyId: parentOrder.companyId,
                startDate: { lte: weekEnd },
                endDate: { gte: weekStart },
              },
            });
            
            if (!productionPlan) {
              productionPlan = await prisma.productionPlan.create({
                data: {
                  companyId: parentOrder.companyId,
                  name: `Week of ${weekStart.toLocaleDateString()}`,
                  startDate: weekStart,
                  endDate: weekEnd,
                  notes: "Auto-created from recurring wholesale order",
                  createdBy: 1,
                },
              });
            }
            
            // Add items to production plan with batch calculation
            for (const item of newOrder.items) {
              const recipe = await prisma.recipe.findUnique({
                where: { id: item.recipeId },
                select: { yieldQuantity: true },
              });

              const batchesNeeded = recipe 
                ? Math.ceil(item.quantity / Number(recipe.yieldQuantity))
                : item.quantity;

              await prisma.productionItem.create({
                data: {
                  planId: productionPlan.id,
                  recipeId: item.recipeId,
                  quantity: batchesNeeded,
                  customerId: parentOrder.customerId,
                  notes: `Recurring order #${newOrder.id} for ${parentOrder.customer.name} - ${item.quantity} units (${batchesNeeded} batches)`,
                  allocations: {
                    create: {
                      customerId: parentOrder.customerId,
                      destination: "wholesale",
                      quantity: batchesNeeded,
                      notes: `Recurring order #${newOrder.id}`,
                    },
                  },
                },
              });
            }
          } catch (prodError) {
            logger.error("Failed to sync recurring order to production", prodError, "Cron/RecurringOrders");
          }
        }

        // Create a notification for the admin
        await prisma.notification.create({
          data: {
            userId: parentOrder.createdBy || 1, // Fallback to user ID 1 if no creator
            type: "wholesale_order",
            title: "New Recurring Order Generated",
            message: `A recurring order for ${parentOrder.customer.name} has been automatically generated (#${newOrder.id})`,
            link: `/dashboard/wholesale/orders`,
            read: false,
          },
        }).catch((err) => {
          logger.error("Failed to create notification", err, "Cron/RecurringOrders");
          // Don't fail the entire operation if notification fails
        });

        generated.push({
          parentOrderId: parentOrder.id,
          newOrderId: newOrder.id,
          customer: parentOrder.customer.name,
          deliveryDate: nextDeliveryDate,
          itemCount: newOrder.items.length,
        });

      } catch (error) {
        logger.error(`Error generating recurring order ${parentOrder.id}`, error, "Cron/RecurringOrders");
        errors.push({
          parentOrderId: parentOrder.id,
          customer: parentOrder.customer.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      generated: generated.length,
      errors: errors.length,
      details: {
        generated,
        errors,
      },
    });

  } catch (error) {
    logger.error("Cron job error", error, "Cron/RecurringOrders");
    return NextResponse.json(
      { 
        error: "Failed to process recurring orders",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST endpoint for manual triggering (with authentication)
export async function POST(request: NextRequest) {
  return GET(request);
}

