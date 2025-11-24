import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { canAccessProduction, createFeatureGateError } from "@/lib/subscription";
import { hasCompanyAccess } from "@/lib/current";
import { createOptimizedResponse } from "@/lib/api-optimization";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to production features
    const hasAccess = await canAccessProduction(session.id);
    if (!hasAccess) {
      return NextResponse.json(
        createFeatureGateError("production", "Production Planning"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, startDate, endDate, items, companyId, notes } = body;

    if (!name || !startDate || !endDate || !items || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const parsedCompanyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;

    // SECURITY: Verify user has access to this company
    const hasCompany = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasCompany) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Create production plan with items and allocations
    const plan = await prisma.productionPlan.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes,
        companyId: parsedCompanyId,
        createdBy: session.id,
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

    return NextResponse.json(plan);
  } catch (error) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, 'Production/Plans/Create');
  }
}

