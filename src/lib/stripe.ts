import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

export const STRIPE_CONFIG = {
  // Product and price IDs - you'll need to create these in your Stripe dashboard
  products: {
    pro: {
      productId: process.env.STRIPE_PRO_PRODUCT_ID || "prod_pro_placeholder",
      priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
    },
    // Seat-based pricing for team members
    seat: {
      productId: process.env.STRIPE_SEAT_PRODUCT_ID || "prod_seat_placeholder", 
      priceId: process.env.STRIPE_SEAT_PRICE_ID || "price_seat_placeholder",
    },
  },
  // Webhook endpoint secret
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
} as const;

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(user: {
  id: number;
  email: string;
  name?: string | null;
}): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId: user.id.toString(),
    },
  });

  return customer;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: "subscription",
    },
  });

  return session;
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription details from Stripe
 */
export async function getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

/**
 * Update subscription with new seat count
 */
export async function updateSubscriptionSeats(
  subscriptionId: string,
  baseSeats: number = 1,
  additionalSeats: number = 0
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Calculate total seats needed
  const totalSeats = baseSeats + additionalSeats;
  
  // Get current subscription items
  const items = subscription.items.data;
  
  // Find base plan item
  const baseItem = items.find(item => item.price.id === STRIPE_CONFIG.products.pro.priceId);
  
  // Find seat item (if exists)
  const seatItem = items.find(item => item.price.id === STRIPE_CONFIG.products.seat.priceId);
  
  // Prepare subscription items for update
  const subscriptionItems: Stripe.SubscriptionUpdateParams.Item[] = [];
  
  // Always include base plan
  if (baseItem) {
    subscriptionItems.push({
      id: baseItem.id,
      price: STRIPE_CONFIG.products.pro.priceId,
      quantity: 1,
    });
  }
  
  // Add or update seat quantity
  if (additionalSeats > 0) {
    if (seatItem) {
      // Update existing seat item
      subscriptionItems.push({
        id: seatItem.id,
        price: STRIPE_CONFIG.products.seat.priceId,
        quantity: additionalSeats,
      });
    } else {
      // Add new seat item
      subscriptionItems.push({
        price: STRIPE_CONFIG.products.seat.priceId,
        quantity: additionalSeats,
      });
    }
  } else if (seatItem) {
    // Remove seat item if no additional seats needed
    subscriptionItems.push({
      id: seatItem.id,
      deleted: true,
    });
  }
  
  // Update the subscription
  return await stripe.subscriptions.update(subscriptionId, {
    items: subscriptionItems,
    proration_behavior: 'create_prorations', // Prorate the billing
  });
}

/**
 * Get current seat count from subscription
 */
export async function getSubscriptionSeatCount(subscriptionId: string): Promise<{
  baseSeats: number;
  additionalSeats: number;
  totalSeats: number;
}> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  let additionalSeats = 0;
  
  // Find seat item and get quantity
  const seatItem = subscription.items.data.find(
    item => item.price.id === STRIPE_CONFIG.products.seat.priceId
  );
  
  if (seatItem) {
    additionalSeats = seatItem.quantity || 0;
  }
  
  return {
    baseSeats: 1, // Base plan always includes 1 seat
    additionalSeats,
    totalSeats: 1 + additionalSeats,
  };
}
