import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, createStripeCustomer } from "@/lib/stripe";
import { getAppFromRoute, getAppAwareRoute } from "@/lib/app-routes";
import type { App } from "@/lib/apps/types";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tier, interval = "month", seats = 0, app: appParam } = body;

    // Detect app from request
    let app: App | null = appParam || null;
    if (!app) {
      const referer = request.headers.get("referer");
      if (referer) {
        try {
          const url = new URL(referer);
          app = getAppFromRoute(url.pathname);
        } catch {
          // Invalid URL, ignore
        }
      }
    }

    // Validate tier
    if (!tier || !["professional", "team", "business", "plato-bake"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier specified" }, { status: 400 });
    }
    
    // Plato Bake only supports monthly billing
    if (tier === "plato-bake" && interval !== "month") {
      return NextResponse.json({ error: "Plato Bake only supports monthly billing" }, { status: 400 });
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

    // Determine success/cancel URLs based on tier and app
    const isPlatoBake = tier === "plato-bake";
    const accountRoute = getAppAwareRoute("/dashboard/account", app || (isPlatoBake ? "plato_bake" : "plato"));
    const successUrl = `${request.nextUrl.origin}${accountRoute}?success=true`;
    
    // Cancel URL - redirect to pricing page for the appropriate app
    const cancelUrl = isPlatoBake
      ? `${request.nextUrl.origin}/bake/pricing?canceled=true`
      : `${request.nextUrl.origin}/pricing?canceled=true`;

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      customerId,
      tier as "professional" | "team" | "business" | "plato-bake",
      interval,
      successUrl,
      cancelUrl,
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
