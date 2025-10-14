import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { completed, quantity, notes } = body;
    const itemId = parseInt(params.id);

    // Get the existing item to check if completion status changed
    const existingItem = await prisma.productionItem.findUnique({
      where: { id: itemId },
      include: {
        recipe: {
          select: {
            yieldQuantity: true,
            yieldUnit: true,
          },
        },
        plan: {
          select: {
            companyId: true,
          },
        },
      },
    });

    const wasJustCompleted = completed === true && existingItem && !existingItem.completed;
    const wasJustUncompleted = completed === false && existingItem && existingItem.completed;

    const item = await prisma.productionItem.update({
      where: { id: itemId },
      data: {
        ...(completed !== undefined && { completed }),
        ...(quantity !== undefined && { quantity }),
        ...(notes !== undefined && { notes }),
        // Track who completed the task and when
        ...(wasJustCompleted && {
          completedBy: session.id,
          completedAt: new Date(),
        }),
        // Clear completion tracking if unchecking
        ...(wasJustUncompleted && {
          completedBy: null,
          completedAt: null,
        }),
      },
      include: {
        recipe: {
          select: {
            id: true,
            yieldQuantity: true,
            yieldUnit: true,
          },
        },
        plan: {
          select: {
            companyId: true,
          },
        },
        completedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If item was just completed, add to inventory
    if (wasJustCompleted && existingItem) {
      try {
        const totalProduced = existingItem.quantity.toNumber() * existingItem.recipe.yieldQuantity.toNumber();
        
        await prisma.inventory.upsert({
          where: {
            companyId_recipeId: {
              companyId: existingItem.plan.companyId,
              recipeId: existingItem.recipeId,
            },
          },
          create: {
            companyId: existingItem.plan.companyId,
            recipeId: existingItem.recipeId,
            quantity: totalProduced,
            unit: existingItem.recipe.yieldUnit,
            lastRestocked: new Date(),
            movements: {
              create: {
                type: "production",
                quantity: totalProduced,
                productionItemId: itemId,
                reason: "Production completed",
                createdBy: session.id,
              },
            },
          },
          update: {
            quantity: {
              increment: totalProduced,
            },
            lastRestocked: new Date(),
            movements: {
              create: {
                type: "production",
                quantity: totalProduced,
                productionItemId: itemId,
                reason: "Production completed",
                createdBy: session.id,
              },
            },
          },
        });
      } catch (inventoryError) {
        console.error("Failed to update inventory:", inventoryError);
        // Don't fail the production item update if inventory fails
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update production item error:", error);
    return NextResponse.json(
      { error: "Failed to update production item" },
      { status: 500 }
    );
  }
}

