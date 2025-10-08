import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, createStripeCustomer, STRIPE_CONFIG } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
      STRIPE_CONFIG.products.pro.priceId,
      `${request.nextUrl.origin}/account?success=true`,
      `${request.nextUrl.origin}/pricing?canceled=true`
    );

    return NextResponse.json({ 
      url: checkoutSession.url 
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

