import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG, getTierFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !STRIPE_CONFIG.webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
  } catch (err) {
    logger.error("Webhook signature verification failed", err, "Webhooks/Stripe");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.debug(`Unhandled event type: ${event.type}`, null, "Webhooks/Stripe");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook handler error", error, "Webhooks/Stripe");
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    logger.error("User not found for customer", { customerId }, "Webhooks/Stripe");
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItem = subscription.items.data[0];
  const price = subscriptionItem.price;

  // Determine tier from price ID - map all paid tiers to "paid"
  const tierInfo = getTierFromPriceId(price.id);
  const tier = tierInfo?.tier || "paid"; // Default to paid for MVP
  const interval = tierInfo?.interval || "month";

  // Update subscription, user in a transaction
  const operations: any[] = [
    prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: price.id,
        stripeProductId: price.product as string,
        status: subscription.status,
        tier: "paid", // All MVP subscriptions are "paid"
        price: price.unit_amount ? price.unit_amount / 100 : 20.00,
        currency: price.currency,
        interval: interval,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      update: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: price.id,
        stripeProductId: price.product as string,
        status: subscription.status,
        tier: "paid",
        price: price.unit_amount ? price.unit_amount / 100 : 20.00,
        currency: price.currency,
        interval: interval,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: "paid",
        subscriptionInterval: interval,
        subscriptionStatus: subscription.status,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      },
    }),
  ];

  await prisma.$transaction(operations);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: subscription.customer as string },
  });

  if (!user) return;

  const subscriptionItem = subscription.items.data[0];
  const price = subscriptionItem.price;

  // Handle MVP subscription update
  const tierInfo = getTierFromPriceId(price.id);
  const tier = tierInfo?.tier || "paid"; // Map all to "paid"
  const interval = tierInfo?.interval || "month";

  // Update subscription and user
  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        tier: "paid",
        interval: interval,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: subscription.status === "active" ? "paid" : "free",
        subscriptionInterval: interval,
        subscriptionStatus: subscription.status,
        subscriptionEndsAt: subscription.status === "active" 
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
    }),
  ]);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: subscription.customer as string },
  });

  if (!user) return;

  // Handle MVP subscription deletion
  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: "free",
        subscriptionStatus: "canceled",
        subscriptionEndsAt: null,
      },
    }),
  ]);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!user) return;

  // Update user's last login to show they're active
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!user) return;

  // Update subscription status to past_due
  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "past_due" },
  });
}
