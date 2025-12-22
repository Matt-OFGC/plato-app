import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { createMVPCheckout, createStripeCustomer } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body; // Only "mvp" supported now

    // Validate subscription type - only MVP supported
    if (!type || type !== "mvp") {
      return NextResponse.json(
        { error: "Invalid subscription type. Must be 'mvp'" },
        { status: 400 }
      );
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

    // Determine success/cancel URLs
    const successUrl = `${request.nextUrl.origin}/dashboard/account?success=true`;
    const cancelUrl = `${request.nextUrl.origin}/pricing?canceled=true`;

    // Create MVP subscription checkout
    const checkoutSession = await createMVPCheckout(customerId, successUrl, cancelUrl);

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    logger.error("Checkout error", error, "Subscription/Checkout");
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
