import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, createStripeCustomer } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tier, interval = "month", seats = 0 } = body;

    // Validate tier
    if (!tier || !["professional", "team", "business"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier specified" }, { status: 400 });
    }

    // Validate interval
    if (!["month", "year"].includes(interval)) {
      return NextResponse.json({ error: "Invalid interval specified" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create Stripe customer if doesn't exist
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await createStripeCustomer(user);
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      customerId,
      tier,
      interval,
      `${request.nextUrl.origin}/dashboard/account?success=true`,
      `${request.nextUrl.origin}/pricing?canceled=true`,
      seats
    );

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
