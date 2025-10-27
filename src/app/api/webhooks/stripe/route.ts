import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG, getTierFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
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
    console.error("Webhook signature verification failed:", err);
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    include: {
      memberships: {
        where: { role: "OWNER" },
        include: { company: true },
      },
    },
  });

  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const price = subscription.items.data[0].price;

  // Determine tier from price ID
  const tierInfo = getTierFromPriceId(price.id);
  const tier = tierInfo?.tier || "professional";
  const interval = tierInfo?.interval || "month";

  // Get seat limits based on tier
  let maxSeats = 1;
  if (tier === "team") {
    maxSeats = 5;
  } else if (tier === "business") {
    maxSeats = 999999; // Effectively unlimited
  }

  // Update subscription, user, and company in a transaction
  const operations: any[] = [
    prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: price.id,
        stripeProductId: price.product as string,
        status: subscription.status,
        tier: tier,
        price: price.unit_amount ? price.unit_amount / 100 : 19.0,
        currency: price.currency,
        interval: interval,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        maxIngredients: null, // All paid tiers have unlimited
        maxRecipes: null, // All paid tiers have unlimited
      },
      update: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: price.id,
        stripeProductId: price.product as string,
        status: subscription.status,
        tier: tier,
        price: price.unit_amount ? price.unit_amount / 100 : 19.0,
        currency: price.currency,
        interval: interval,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        maxIngredients: null,
        maxRecipes: null,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: tier,
        subscriptionInterval: interval,
        subscriptionStatus: subscription.status,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      },
    }),
  ];

  // Add company updates to transaction
  if (user.memberships.length > 0) {
    for (const membership of user.memberships) {
      if (membership.company) {
        operations.push(
          prisma.company.update({
            where: { id: membership.company.id },
            data: {
              maxSeats: maxSeats,
            },
          })
        );
      }
    }
  }

  await prisma.$transaction(operations);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer as string },
    include: {
      memberships: {
        where: { role: "OWNER" },
        include: { company: true },
      },
    },
  });

  if (!user) return;

  // Get the main price to determine tier
  const price = subscription.items.data[0].price;
  const tierInfo = getTierFromPriceId(price.id);
  const tier = tierInfo?.tier || "professional";
  const interval = tierInfo?.interval || "month";

  // Get seat limits based on tier
  let maxSeats = 1;
  if (tier === "team") {
    maxSeats = 5;
  } else if (tier === "business") {
    maxSeats = 999999;
  }

  // Update subscription, user, and company in a transaction
  const operations: any[] = [
    prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        tier: tier,
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
        subscriptionTier: tier,
        subscriptionInterval: interval,
        subscriptionStatus: subscription.status,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      },
    }),
  ];

  // Add company updates to transaction
  if (user.memberships.length > 0) {
    for (const membership of user.memberships) {
      if (membership.company) {
        operations.push(
          prisma.company.update({
            where: { id: membership.company.id },
            data: {
              maxSeats: maxSeats,
            },
          })
        );
      }
    }
  }

  await prisma.$transaction(operations);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer as string },
    include: {
      memberships: {
        where: { role: "OWNER" },
        include: { company: true },
      },
    },
  });

  if (!user) return;

  // Update subscription, user, and company in a transaction
  const operations: any[] = [
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
        subscriptionTier: "starter",
        subscriptionStatus: "canceled",
        subscriptionEndsAt: null,
      },
    }),
  ];

  // Add company updates to transaction
  if (user.memberships.length > 0) {
    for (const membership of user.memberships) {
      if (membership.company) {
        operations.push(
          prisma.company.update({
            where: { id: membership.company.id },
            data: {
              maxSeats: 1,
            },
          })
        );
      }
    }
  }

  await prisma.$transaction(operations);
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
