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
  // MVP subscription pricing only
  mvp: {
    monthlyPriceId: process.env.STRIPE_MVP_MONTHLY_PRICE_ID || "",
  },
  // Tier-based prices (for backwards compatibility - deprecated, will be removed)
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
    "plato-bake": {
      productId: process.env.STRIPE_PLATO_BAKE_PRODUCT_ID || "",
      monthlyPriceId: process.env.STRIPE_PLATO_BAKE_MONTHLY_PRICE_ID || "",
    },
    seat: {
      productId: process.env.STRIPE_SEAT_PRODUCT_ID || "",
      priceId: process.env.STRIPE_SEAT_PRICE_ID || "",
    },
  },
};

// Get tier from price ID (for backwards compatibility)
// Returns "paid" for MVP subscription or old paid tiers
export function getTierFromPriceId(priceId: string): { tier: string; interval: "month" | "year" } | null {
  // Check new MVP price
  if (priceId === STRIPE_CONFIG.mvp.monthlyPriceId) {
    return { tier: "paid", interval: "month" };
  }

  // Backward compatibility: old paid tiers map to "paid"
  if (priceId === STRIPE_CONFIG.products.professional.monthlyPriceId) {
    return { tier: "paid", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.professional.annualPriceId) {
    return { tier: "paid", interval: "year" };
  }
  if (priceId === STRIPE_CONFIG.products.team.monthlyPriceId) {
    return { tier: "paid", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.team.annualPriceId) {
    return { tier: "paid", interval: "year" };
  }
  if (priceId === STRIPE_CONFIG.products.business.monthlyPriceId) {
    return { tier: "paid", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.business.annualPriceId) {
    return { tier: "paid", interval: "year" };
  }
  if (priceId === STRIPE_CONFIG.products["plato-bake"].monthlyPriceId) {
    return { tier: "paid", interval: "month" };
  }
  if (priceId === STRIPE_CONFIG.products.pro.priceId) {
    return { tier: "paid", interval: "month" };
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

// Create checkout session for MVP subscription
export async function createMVPCheckout(
  customerId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const priceId = STRIPE_CONFIG.mvp.monthlyPriceId;

  if (!priceId) {
    throw new Error("MVP price ID not configured");
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
      type: "mvp",
    },
  });
}


// Legacy function for backward compatibility (deprecated)
export async function createCheckoutSession(
  customerId: string,
  tier: "professional" | "team" | "business" | "plato-bake",
  interval: "month" | "year" = "month",
  successUrl: string,
  cancelUrl: string,
  seats: number = 0
): Promise<Stripe.Checkout.Session> {
  // Map old tiers to MVP checkout
  const priceKey = interval === "month" ? "monthlyPriceId" : "annualPriceId";
  const priceId = STRIPE_CONFIG.products[tier]?.[priceKey];

  if (!priceId) {
    // Fallback to MVP if old tier not found
    return createMVPCheckout(customerId, successUrl, cancelUrl);
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: priceId,
      quantity: 1,
    },
  ];

  // Add seat addon if needed (deprecated - no longer used)
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
      type: "legacy",
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

