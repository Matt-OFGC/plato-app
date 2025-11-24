import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getSubscriptionSeatCount } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '0');

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 });
    }

    // Check if user has access to this company
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "No access to this company" }, { status: 403 });
    }

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        memberships: {
          where: { isActive: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get admin's subscription for billing info
    const adminMembership = await prisma.membership.findFirst({
      where: { 
        companyId,
        role: "ADMIN",
        isActive: true,
      },
    });

    let additionalSeats = 0;
    let basePrice = 9.99; // Default base price
    let pricePerSeat = 5.00; // Default seat price

    if (adminMembership) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: adminMembership.userId },
      });

      if (subscription?.stripeSubscriptionId) {
        try {
          const seatInfo = await getSubscriptionSeatCount(subscription.stripeSubscriptionId);
          additionalSeats = seatInfo.additionalSeats;
          basePrice = subscription.price.toNumber();
        } catch (error) {
          console.error("Failed to get Stripe seat count:", error);
          // Fall back to calculated values
          additionalSeats = Math.max(0, company.memberships.length - 1);
        }
      } else {
        // Fall back to calculated values if no Stripe subscription
        additionalSeats = Math.max(0, company.memberships.length - 1);
      }
    }

    const currentSeats = company.memberships.length;
    const maxSeats = company.maxSeats;
    const monthlyTotal = basePrice + (additionalSeats * pricePerSeat);

    return NextResponse.json({
      currentSeats,
      maxSeats,
      pricePerSeat,
      basePrice,
      additionalSeats,
      monthlyTotal,
    });
  } catch (error) {
    console.error("Get seats error:", error);
    return NextResponse.json(
      { error: "Failed to get seat information" },
      { status: 500 }
    );
  }
}
