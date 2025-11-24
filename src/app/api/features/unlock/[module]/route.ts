import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { createFeatureModuleCheckout, createStripeCustomer } from "@/lib/stripe";
import { FeatureModuleName } from "@/lib/stripe-features";
import { getAppFromRoute, getAppAwareRoute } from "@/lib/app-routes";
import { logger } from "@/lib/logger";
import type { App } from "@/lib/apps/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { module } = await params;
    const moduleName = module as FeatureModuleName;
    
    // Detect app from request
    let app: App | null = null;
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const url = new URL(referer);
        app = getAppFromRoute(url.pathname);
      } catch {
        // Invalid URL, ignore
      }
    }

    // Validate module name
    const validModules: FeatureModuleName[] = ["recipes", "production", "make", "teams", "safety"];
    if (!validModules.includes(moduleName)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already unlocked
    const existingModule = await prisma.featureModule.findUnique({
      where: {
        userId_moduleName: {
          userId: user.id,
          moduleName,
        },
      },
    });

    if (existingModule && existingModule.status === "active" && !existingModule.isTrial) {
      return NextResponse.json({ error: "Module already unlocked" }, { status: 400 });
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

    // Create checkout session with app-aware URLs
    const accountRoute = getAppAwareRoute("/dashboard/account", app);
    const dashboardRoute = getAppAwareRoute("/dashboard", app);
    const checkoutSession = await createFeatureModuleCheckout(
      customerId,
      moduleName,
      `${request.nextUrl.origin}${accountRoute}?success=true&module=${moduleName}`,
      `${request.nextUrl.origin}${dashboardRoute}?canceled=true`
    );

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    logger.error("Unlock module error", error, "Features/Unlock");
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

