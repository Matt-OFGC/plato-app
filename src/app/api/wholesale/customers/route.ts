import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { canAccessWholesale, createFeatureGateError } from "@/lib/subscription";
import { hasCompanyAccess } from "@/lib/current";
import { logger } from "@/lib/logger";

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
        createFeatureGateError("production", "Wholesale Management"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      contactName,
      email,
      phone,
      address,
      city,
      postcode,
      country,
      notes,
      isActive,
      companyId,
      openingHours,
      deliveryDays,
      preferredDeliveryTime,
      paymentTerms,
      creditLimit,
      taxId,
      accountManager,
      specialInstructions,
      orderFrequency,
    } = body;

    if (!name || !companyId) {
      return NextResponse.json(
        { error: "Name and companyId are required" },
        { status: 400 }
      );
    }

    const parsedCompanyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;

    // SECURITY: Verify user has access to this company
    const hasCompany = await hasCompanyAccess(session.id, parsedCompanyId);
    if (!hasCompany) {
      logger.error("User does not have access to company", { userId: session.id, companyId: parsedCompanyId }, "Wholesale/Customers");
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Prepare data with proper defaults
    const customerData: any = {
      name,
      contactName: contactName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      postcode: postcode || null,
      country: country || null,
      notes: notes || null,
      isActive: isActive ?? true,
      companyId: parsedCompanyId,
      openingHours: (openingHours && typeof openingHours === 'object' && !Array.isArray(openingHours) && Object.keys(openingHours).length > 0) ? openingHours : null,
      deliveryDays: Array.isArray(deliveryDays) ? deliveryDays : [],
      preferredDeliveryTime: preferredDeliveryTime || null,
      paymentTerms: paymentTerms || null,
      creditLimit: creditLimit && creditLimit !== '' ? parseFloat(String(creditLimit)) : null,
      taxId: taxId || null,
      accountManager: accountManager || null,
      specialInstructions: specialInstructions || null,
      orderFrequency: orderFrequency || null,
    };

    logger.debug("Creating customer with data", customerData, "Wholesale/Customers");

    const customer = await prisma.wholesaleCustomer.create({
      data: customerData,
      include: {
        _count: {
          select: {
            productionItems: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    logger.error("Failed to create wholesale customer", error, "Wholesale/Customers");
    console.error("Customer creation error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        error: "Failed to create customer",
        details: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN_ERROR"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to wholesale features
    const hasAccess = await canAccessWholesale(session.id);
    if (!hasAccess) {
      return NextResponse.json(
        createFeatureGateError("production", "Wholesale Management"),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

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

    const customers = await prisma.wholesaleCustomer.findMany({
      where: {
        companyId: parsedCompanyId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
  } catch (error) {
    logger.error("Failed to fetch wholesale customers", error, "Wholesale/Customers");
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

