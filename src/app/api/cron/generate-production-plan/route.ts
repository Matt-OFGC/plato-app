import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, startOfWeek, format } from "date-fns";

// This endpoint auto-generates weekly production plans from pending wholesale orders
// Designed to run every Monday at 7am
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job (optional: add auth header check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all companies
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
    });

    const results = [];

    for (const company of companies) {
      try {
        // Calculate this week's date range (Monday to Sunday)
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = addDays(weekStart, 6); // Sunday

        // Check if a production plan already exists for this week
        const existingPlan = await prisma.productionPlan.findFirst({
          where: {
            companyId: company.id,
            startDate: { lte: weekEnd },
            endDate: { gte: weekStart },
          },
        });

        if (existingPlan) {
          results.push({
            companyId: company.id,
            companyName: company.name,
            status: "skipped",
            reason: "Production plan already exists for this week",
          });
          continue;
        }

        // Get pending and confirmed wholesale orders for this week
        const orders = await prisma.wholesaleOrder.findMany({
          where: {
            companyId: company.id,
            status: {
              in: ["pending", "confirmed"],
            },
            deliveryDate: {
              gte: weekStart,
              lte: weekEnd,
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

        if (orders.length === 0) {
          results.push({
            companyId: company.id,
            companyName: company.name,
            status: "skipped",
            reason: "No orders for this week",
          });
          continue;
        }

        // Aggregate items by recipe with customer allocations
        const recipeMap = new Map<
          number,
          Array<{ quantity: number; customerId: number; customerName: string }>
        >();

        orders.forEach((order) => {
          order.items.forEach((item) => {
            const existing = recipeMap.get(item.recipeId) || [];
            existing.push({
              quantity: item.quantity,
              customerId: order.customerId,
              customerName: order.customer.name,
            });
            recipeMap.set(item.recipeId, existing);
          });
        });

        // Build production items with allocations
        const items = [];
        let priority = 0;

        for (const [recipeId, orderItems] of recipeMap.entries()) {
          const recipe = orderItems[0];
          
          // Get recipe details
          const recipeData = await prisma.recipe.findUnique({
            where: { id: recipeId },
            select: { yieldQuantity: true },
          });

          if (!recipeData) continue;

          // Group by customer
          const customerGroups = new Map<
            number,
            { name: string; quantity: number }
          >();
          
          orderItems.forEach((item) => {
            const current = customerGroups.get(item.customerId);
            if (current) {
              current.quantity += item.quantity;
            } else {
              customerGroups.set(item.customerId, {
                name: item.customerName,
                quantity: item.quantity,
              });
            }
          });

          // Create allocations
          const allocations = Array.from(customerGroups.entries()).map(
            ([customerId, data]) => ({
              destination: data.name,
              customerId,
              quantity: data.quantity,
              notes: "Auto-generated from wholesale orders",
            })
          );

          // Calculate total quantity and batches needed
          const totalQuantity = allocations.reduce(
            (sum, alloc) => sum + alloc.quantity,
            0
          );
          const batchesNeeded = Math.ceil(
            totalQuantity / Number(recipeData.yieldQuantity)
          );

          items.push({
            recipeId,
            quantity: batchesNeeded,
            priority: priority++,
            allocations,
          });
        }

        // Create the production plan
        const plan = await prisma.productionPlan.create({
          data: {
            name: `Auto-Generated Week ${format(weekStart, "MMM d, yyyy")}`,
            startDate: weekStart,
            endDate: weekEnd,
            notes: `Automatically generated from ${orders.length} wholesale order(s)`,
            companyId: company.id,
            createdBy: 1, // System user - you might want to create a dedicated system user
            items: {
              create: items.map((item) => ({
                recipeId: item.recipeId,
                quantity: item.quantity,
                priority: item.priority,
                allocations: {
                  create: item.allocations,
                },
              })),
            },
          },
          include: {
            items: {
              include: {
                recipe: true,
                allocations: true,
              },
            },
          },
        });

        results.push({
          companyId: company.id,
          companyName: company.name,
          status: "success",
          planId: plan.id,
          planName: plan.name,
          itemsCount: plan.items.length,
          ordersProcessed: orders.length,
        });
      } catch (error) {
        console.error(
          `Error generating plan for company ${company.id}:`,
          error
        );
        results.push({
          companyId: company.id,
          companyName: company.name,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Generate production plans cron error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate production plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

