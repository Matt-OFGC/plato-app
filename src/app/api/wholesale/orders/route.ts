import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { canAccessWholesale, createFeatureGateError } from "@/lib/subscription";
import { hasCompanyAccess } from "@/lib/current";
import { createOptimizedResponse } from "@/lib/api-optimization";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to wholesale features
    const hasAccess = await canAccessWholesale(session.id);
    if (!hasAccess) {
      return NextResponse.json(
        createFeatureGateError("production", "Wholesale Orders"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      customerId,
      companyId,
      orderNumber,
      deliveryDate,
      status,
      notes,
      items,
      isRecurring,
      recurringInterval,
      recurringIntervalDays,
      recurringEndDate,
      recurringStatus,
    } = body;

    if (!customerId || !companyId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer ID, company ID, and items are required" },
        { status: 400 }
      );
    }

    const parsedCompanyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;
    const parsedCustomerId = typeof customerId === 'string' ? parseInt(customerId) : customerId;

    // SECURITY: Verify user has access to this company
    const hasCompany = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasCompany) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Get customer to check credit limit
    const customer = await prisma.wholesaleCustomer.findUnique({
      where: { id: parsedCustomerId },
      select: {
        creditLimit: true,
        outstandingBalance: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate order total
    let orderTotal = 0;
    for (const item of items) {
      const itemPrice = item.price ? parseFloat(item.price) : 0;
      orderTotal += itemPrice * item.quantity;
    }

    // Check credit limit if set
    if (customer.creditLimit) {
      const currentBalance = Number(customer.outstandingBalance || 0);
      const newBalance = currentBalance + orderTotal;
      
      if (newBalance > Number(customer.creditLimit)) {
        return NextResponse.json(
          { 
            error: "Credit limit exceeded",
            currentBalance: currentBalance.toString(),
            creditLimit: customer.creditLimit.toString(),
            orderTotal: orderTotal.toString(),
            newBalance: newBalance.toString(),
          },
          { status: 400 }
        );
      }
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
      } else if (recurringIntervalDays) {
        nextRecurrenceDate = new Date(delivery);
        nextRecurrenceDate.setDate(nextRecurrenceDate.getDate() + recurringIntervalDays);
      }
    }

    const order = await prisma.wholesaleOrder.create({
      data: {
        customerId: parsedCustomerId,
        companyId: parsedCompanyId,
        orderNumber,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        status: status || "pending",
        notes,
        isRecurring: isRecurring || false,
        recurringInterval: isRecurring ? recurringInterval : null,
        recurringIntervalDays: isRecurring ? recurringIntervalDays : null,
        recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : null,
        recurringStatus: isRecurring ? (recurringStatus || "active") : null,
        nextRecurrenceDate,
        items: {
          create: items.map((item: any) => ({
            recipeId: item.recipeId,
            quantity: item.quantity,
            price: item.price ? parseFloat(item.price) : null,
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

    // Update customer statistics
    await prisma.wholesaleCustomer.update({
      where: { id: parsedCustomerId },
      data: {
        lastOrderDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        totalOrders: {
          increment: 1,
        },
        totalValue: {
          increment: orderTotal,
        },
        outstandingBalance: {
          increment: orderTotal,
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, 'Wholesale/Orders/Create');
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const parsedCompanyId = parseInt(companyId);

    // SECURITY: Verify user has access to this company
    const hasCompany = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasCompany) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    const where: any = {
      companyId: parsedCompanyId,
    };

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (status) {
      where.status = status;
    }

    // Filter by delivery date range
    if (startDate || endDate) {
      where.deliveryDate = {};
      if (startDate) {
        where.deliveryDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.deliveryDate.lte = new Date(endDate);
      }
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
      },
      orderBy: [
        { status: 'asc' },
        { deliveryDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return createOptimizedResponse(
      orders,
      { 
        cacheType: 'dynamic', // Orders change frequently
        compression: true,
      }
    );
  } catch (error) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, 'Wholesale/Orders/Get');
  }
}

