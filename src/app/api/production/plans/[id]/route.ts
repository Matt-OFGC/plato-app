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
    const planId = parseInt(id);
    const body = await request.json();
    const { name, startDate, endDate, items, notes } = body;

    if (!name || !startDate || !endDate || !items) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the plan exists and user has access
    const existingPlan = await prisma.productionPlan.findUnique({
      where: { id: planId },
      select: { id: true, companyId: true },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, existingPlan.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this plan" },
        { status: 403 }
      );
    }

    // Delete existing items and create new ones
    await prisma.productionItem.deleteMany({
      where: { planId },
    });

    // Update the plan with new items
    const updatedPlan = await prisma.productionPlan.update({
      where: { id: planId },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes,
        items: {
          create: items.map((item: any, index: number) => ({
            recipeId: item.recipeId,
            quantity: item.quantity,
            priority: index,
            allocations: item.allocations && item.allocations.length > 0 ? {
              create: item.allocations.map((alloc: any) => ({
                destination: alloc.destination,
                customerId: alloc.customerId,
                quantity: alloc.quantity,
                notes: alloc.notes,
              })),
            } : undefined,
          })),
        },
      },
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
            allocations: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        tasks: true,
      },
    });

    // Update order status to "in_production" for any orders that have allocations in this plan
    const customerIds = new Set<number>();
    updatedPlan.items.forEach(item => {
      item.allocations.forEach(alloc => {
        if (alloc.customerId) {
          customerIds.add(alloc.customerId);
        }
      });
    });

    if (customerIds.size > 0) {
      const ordersToUpdate = await prisma.wholesaleOrder.findMany({
        where: {
          companyId: existingPlan.companyId,
          customerId: { in: Array.from(customerIds) },
          status: "confirmed",
          deliveryDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          items: {
            select: {
              recipeId: true,
            },
          },
        },
      });

      const recipeIdsInPlan = new Set(updatedPlan.items.map(item => item.recipeId));
      
      for (const order of ordersToUpdate) {
        const hasMatchingItems = order.items.some(item => recipeIdsInPlan.has(item.recipeId));
        const orderHasAllocations = updatedPlan.items.some(item =>
          item.allocations.some(alloc => alloc.customerId === order.customerId)
        );
        
        if (hasMatchingItems && orderHasAllocations) {
          await prisma.wholesaleOrder.update({
            where: { id: order.id },
            data: { status: "in_production" },
          });
        }
      }
    }

    return NextResponse.json(updatedPlan);
  } catch (error) {
    logger.error("Update production plan error", error, "Production/Plans");
    return NextResponse.json(
      { error: "Failed to update production plan" },
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
    const planId = parseInt(id);

    // Verify the plan exists and user has access
    const existingPlan = await prisma.productionPlan.findUnique({
      where: { id: planId },
      select: { id: true, companyId: true },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // SECURITY: Verify user has access to this company
    const hasAccess = await hasCompanyAccess(session.id, existingPlan.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this plan" },
        { status: 403 }
      );
    }

    // Delete the plan (cascade will delete items and tasks)
    await prisma.productionPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete production plan error", error, "Production/Plans");
    return NextResponse.json(
      { error: "Failed to delete production plan" },
      { status: 500 }
    );
  }
}

