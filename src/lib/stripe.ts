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
    professional: {
      monthly: {
        productId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID || "prod_professional_placeholder",
        priceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || "price_professional_monthly_placeholder",
      },
      annual: {
        productId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID || "prod_professional_placeholder",
        priceId: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || "price_professional_annual_placeholder",
      },
    },
    team: {
      monthly: {
        productId: process.env.STRIPE_TEAM_PRODUCT_ID || "prod_team_placeholder",
        priceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || "price_team_monthly_placeholder",
      },
      annual: {
        productId: process.env.STRIPE_TEAM_PRODUCT_ID || "prod_team_placeholder",
        priceId: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || "price_team_annual_placeholder",
      },
    },
    business: {
      monthly: {
        productId: process.env.STRIPE_BUSINESS_PRODUCT_ID || "prod_business_placeholder",
        priceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "price_business_monthly_placeholder",
      },
      annual: {
        productId: process.env.STRIPE_BUSINESS_PRODUCT_ID || "prod_business_placeholder",
        priceId: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || "price_business_annual_placeholder",
      },
    },
    // Seat-based pricing for team tier additional seats
    teamSeat: {
      monthly: {
        productId: process.env.STRIPE_TEAM_SEAT_PRODUCT_ID || "prod_team_seat_placeholder",
        priceId: process.env.STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID || "price_team_seat_monthly_placeholder",
      },
      annual: {
        productId: process.env.STRIPE_TEAM_SEAT_PRODUCT_ID || "prod_team_seat_placeholder",
        priceId: process.env.STRIPE_TEAM_SEAT_ANNUAL_PRICE_ID || "price_team_seat_annual_placeholder",
      },
    },
  },
  // Webhook endpoint secret
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
} as const;

// Map price IDs back to tiers for webhook handling
export function getTierFromPriceId(priceId: string): { tier: string; interval: "month" | "year" } | null {
  // Professional
  if (priceId === STRIPE_CONFIG.products.professional.monthly.priceId) {
    return { tier: "professional", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.professional.annual.priceId) {
    return { tier: "professional", interval: "year" };
  }
  
  // Team
  if (priceId === STRIPE_CONFIG.products.team.monthly.priceId) {
    return { tier: "team", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.team.annual.priceId) {
    return { tier: "team", interval: "year" };
  }
  
  // Business
  if (priceId === STRIPE_CONFIG.products.business.monthly.priceId) {
    return { tier: "business", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.business.annual.priceId) {
    return { tier: "business", interval: "year" };
  }
  
  return null;
}

/**
 * Get the appropriate price ID for a tier and interval
 */
export function getPriceId(tier: "professional" | "team" | "business", interval: "month" | "year"): string {
  const intervalKey = interval === "month" ? "monthly" : "annual";
  return STRIPE_CONFIG.products[tier][intervalKey].priceId;
}

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
  tier: "professional" | "team" | "business",
  interval: "month" | "year",
  successUrl: string,
  cancelUrl: string,
  additionalSeats: number = 0
): Promise<Stripe.Checkout.Session> {
  const priceId = getPriceId(tier, interval);
  
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: priceId,
      quantity: 1,
    },
  ];
  
  // Add additional seats for Team tier if requested
  if (tier === "team" && additionalSeats > 0) {
    const seatPriceId = interval === "month" 
      ? STRIPE_CONFIG.products.teamSeat.monthly.priceId
      : STRIPE_CONFIG.products.teamSeat.annual.priceId;
    
    lineItems.push({
      price: seatPriceId,
      quantity: additionalSeats,
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: "subscription",
      tier,
      interval,
      additionalSeats: additionalSeats.toString(),
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
 * Update subscription with new seat count (for Team tier)
 */
export async function updateSubscriptionSeats(
  subscriptionId: string,
  interval: "month" | "year",
  additionalSeats: number = 0
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get current subscription items
  const items = subscription.items.data;
  
  // Find team base plan item
  const teamMonthlyPriceId = STRIPE_CONFIG.products.team.monthly.priceId;
  const teamAnnualPriceId = STRIPE_CONFIG.products.team.annual.priceId;
  const baseItem = items.find(item => 
    item.price.id === teamMonthlyPriceId || 
    item.price.id === teamAnnualPriceId
  );
  
  // Find seat item (if exists)
  const seatMonthlyPriceId = STRIPE_CONFIG.products.teamSeat.monthly.priceId;
  const seatAnnualPriceId = STRIPE_CONFIG.products.teamSeat.annual.priceId;
  const seatItem = items.find(item => 
    item.price.id === seatMonthlyPriceId || 
    item.price.id === seatAnnualPriceId
  );
  
  // Prepare subscription items for update
  const subscriptionItems: Stripe.SubscriptionUpdateParams.Item[] = [];
  
  // Always include base plan
  if (baseItem) {
    subscriptionItems.push({
      id: baseItem.id,
      price: baseItem.price.id,
      quantity: 1,
    });
  }
  
  // Get appropriate seat price ID based on interval
  const seatPriceId = interval === "month" 
    ? STRIPE_CONFIG.products.teamSeat.monthly.priceId
    : STRIPE_CONFIG.products.teamSeat.annual.priceId;
  
  // Add or update seat quantity
  if (additionalSeats > 0) {
    if (seatItem) {
      // Update existing seat item
      subscriptionItems.push({
        id: seatItem.id,
        price: seatPriceId,
        quantity: additionalSeats,
      });
    } else {
      // Add new seat item
      subscriptionItems.push({
        price: seatPriceId,
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
  const seatMonthlyPriceId = STRIPE_CONFIG.products.teamSeat.monthly.priceId;
  const seatAnnualPriceId = STRIPE_CONFIG.products.teamSeat.annual.priceId;
  const seatItem = subscription.items.data.find(
    item => item.price.id === seatMonthlyPriceId || item.price.id === seatAnnualPriceId
  );
  
  if (seatItem) {
    additionalSeats = seatItem.quantity || 0;
  }
  
  return {
    baseSeats: 1, // Base plan always includes 1 seat (Professional), or 5 seats (Team)
    additionalSeats,
    totalSeats: 1 + additionalSeats,
  };
}
