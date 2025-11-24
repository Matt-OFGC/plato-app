import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { createMVPCheckout, createAICheckout, createStripeCustomer } from "@/lib/stripe";
import { getCurrentUserAndCompany } from "@/lib/current";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body; // "mvp", "ai-unlimited", or "ai-capped"

    // Validate subscription type
    if (!type || !["mvp", "ai-unlimited", "ai-capped"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid subscription type. Must be 'mvp', 'ai-unlimited', or 'ai-capped'" },
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

    let checkoutSession;

    if (type === "mvp") {
      // Create MVP subscription checkout
      checkoutSession = await createMVPCheckout(customerId, successUrl, cancelUrl);
    } else {
      // Create AI subscription checkout
      const subscriptionType = type === "ai-unlimited" ? "unlimited" : "capped";
      
      // For AI subscriptions, we need a company
      const { companyId } = await getCurrentUserAndCompany();
      if (!companyId) {
        return NextResponse.json(
          { error: "Company required for AI subscription" },
          { status: 400 }
        );
      }

      checkoutSession = await createAICheckout(
        customerId,
        subscriptionType,
        successUrl,
        cancelUrl
      );
    }

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
