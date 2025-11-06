import Stripe from "stripe";

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Stripe configuration
export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY || "",
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  // Tier-based prices (for backwards compatibility - deprecated)
  products: {
    pro: {
      productId: process.env.STRIPE_PRO_PRODUCT_ID || "",
      priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    },
    professional: {
      productId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID || "",
      monthlyPriceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || "",
      annualPriceId: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || "",
    },
    team: {
      productId: process.env.STRIPE_TEAM_PRODUCT_ID || "",
      monthlyPriceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || "",
      annualPriceId: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || "",
    },
    business: {
      productId: process.env.STRIPE_BUSINESS_PRODUCT_ID || "",
      monthlyPriceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "",
      annualPriceId: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || "",
    },
    seat: {
      productId: process.env.STRIPE_SEAT_PRODUCT_ID || "",
      priceId: process.env.STRIPE_SEAT_PRICE_ID || "",
    },
  },
};

// Get tier from price ID (for backwards compatibility)
export function getTierFromPriceId(priceId: string): { tier: string; interval: "month" | "year" } | null {
  // Check professional prices
  if (priceId === STRIPE_CONFIG.products.professional.monthlyPriceId) {
    return { tier: "professional", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.professional.annualPriceId) {
    return { tier: "professional", interval: "year" };
  }

  // Check team prices
  if (priceId === STRIPE_CONFIG.products.team.monthlyPriceId) {
    return { tier: "team", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.team.annualPriceId) {
    return { tier: "team", interval: "year" };
  }

  // Check business prices
  if (priceId === STRIPE_CONFIG.products.business.monthlyPriceId) {
    return { tier: "business", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.business.annualPriceId) {
    return { tier: "business", interval: "year" };
  }

  // Fallback to old pro price
  if (priceId === STRIPE_CONFIG.products.pro.priceId) {
    return { tier: "professional", interval: "month" };
  }

  return null;
}

// Create Stripe customer
export async function createStripeCustomer(user: { email: string; name: string | null }): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
  });
}

// Create checkout session (for tier-based - backwards compatibility)
export async function createCheckoutSession(
  customerId: string,
  tier: "professional" | "team" | "business",
  interval: "month" | "year" = "month",
  successUrl: string,
  cancelUrl: string,
  seats: number = 0
): Promise<Stripe.Checkout.Session> {
  const priceKey = interval === "month" ? "monthlyPriceId" : "annualPriceId";
  const priceId = STRIPE_CONFIG.products[tier]?.[priceKey];

  if (!priceId) {
    throw new Error(`Price ID not found for tier ${tier} interval ${interval}`);
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: priceId,
      quantity: 1,
    },
  ];

  // Add seat addon if needed
  if (seats > 0 && STRIPE_CONFIG.products.seat.priceId) {
    lineItems.push({
      price: STRIPE_CONFIG.products.seat.priceId,
      quantity: seats,
    });
  }

  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tier,
      interval,
    },
  });
}

// Create checkout session for feature module
export async function createFeatureModuleCheckout(
  customerId: string,
  moduleName: "recipes" | "production" | "make" | "teams" | "safety",
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const priceId = process.env[`STRIPE_${moduleName.toUpperCase()}_MONTHLY_PRICE_ID`];
  
  if (!priceId) {
    throw new Error(`Price ID not found for module ${moduleName}`);
  }

  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      module: moduleName,
      type: "feature_module",
    },
  });
}

// Create billing portal session
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Get subscription seat count
export async function getSubscriptionSeatCount(customerId: string): Promise<number> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return 0;
  }

  const subscription = subscriptions.data[0];
  // Find seat quantity in subscription items
  const seatItem = subscription.items.data.find(
    item => item.price.id === STRIPE_CONFIG.products.seat.priceId
  );

  return seatItem?.quantity || 0;
}

// Update subscription seats
export async function updateSubscriptionSeats(
  customerId: string,
  newSeatCount: number
): Promise<void> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    throw new Error('No active subscription found');
  }

  const subscription = subscriptions.data[0];
  const seatPriceId = STRIPE_CONFIG.products.seat.priceId;

  if (!seatPriceId) {
    throw new Error('Seat price ID not configured');
  }

  // Find existing seat item
  const seatItem = subscription.items.data.find(
    item => item.price.id === seatPriceId
  );

  if (newSeatCount === 0 && seatItem) {
    // Remove seat addon
    await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: seatItem.id,
        deleted: true,
      }],
    });
  } else if (seatItem) {
    // Update existing seat quantity
    await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: seatItem.id,
        quantity: newSeatCount,
      }],
    });
  } else if (newSeatCount > 0) {
    // Add seat addon
    await stripe.subscriptions.update(subscription.id, {
      items: [{
        price: seatPriceId,
        quantity: newSeatCount,
      }],
    });
  }
}

