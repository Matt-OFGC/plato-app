import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { canAccessWholesale, createFeatureGateError } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to wholesale features
    const hasAccess = await canAccessWholesale(session.id);
    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { subscriptionTier: true },
      });
      const currentTier = user?.subscriptionTier || "starter";
      return NextResponse.json(
        createFeatureGateError("business", currentTier as any, "Wholesale Management"),
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
    } = body;

    if (!name || !companyId) {
      return NextResponse.json(
        { error: "Name and companyId are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.wholesaleCustomer.create({
      data: {
        name,
        contactName,
        email,
        phone,
        address,
        city,
        postcode,
        country,
        notes,
        isActive: isActive ?? true,
        companyId,
      },
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
  } catch (error) {
    console.error("Create wholesale customer error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
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
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { subscriptionTier: true },
      });
      const currentTier = user?.subscriptionTier || "starter";
      return NextResponse.json(
        createFeatureGateError("business", currentTier as any, "Wholesale Management"),
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

    const customers = await prisma.wholesaleCustomer.findMany({
      where: {
        companyId: parseInt(companyId),
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Get wholesale customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

