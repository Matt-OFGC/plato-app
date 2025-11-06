import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { createFeatureModuleCheckout, createStripeCustomer } from "@/lib/stripe";
import { FeatureModuleName } from "@/lib/stripe-features";

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

    // Create checkout session
    const checkoutSession = await createFeatureModuleCheckout(
      customerId,
      moduleName,
      `${request.nextUrl.origin}/dashboard/account?success=true&module=${moduleName}`,
      `${request.nextUrl.origin}/dashboard?canceled=true`
    );

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Unlock module error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

