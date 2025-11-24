/**
 * Script to create Stripe product and price for Mentor AI Assistant
 * Run this after setting STRIPE_SECRET_KEY in your environment
 */

import Stripe from "stripe";

async function createMentorProduct() {
  // Try common Stripe key variable names
  const stripeKey = 
    process.env.STRIPE_SECRET_KEY || 
    process.env.STRIPE_SECRET_KEY_TEST ||
    process.env.STRIPE_SECRET_KEY_LIVE ||
    process.env.STRIPE_SECRET_KEY_PROD ||
    process.env.STRIPE_SECRET;
  
  if (!stripeKey) {
    console.error("❌ Stripe secret key not found in environment variables");
    console.log("Please set one of these in your .env file:");
    console.log("  - STRIPE_SECRET_KEY");
    console.log("  - STRIPE_SECRET_KEY_TEST");
    console.log("  - STRIPE_SECRET_KEY_LIVE");
    console.log("  - STRIPE_SECRET");
    console.log("\nOr create the product manually in Stripe Dashboard:");
    console.log("1. Go to https://dashboard.stripe.com/products");
    console.log("2. Click 'Add product'");
    console.log("3. Name: 'Mentor AI Assistant'");
    console.log("4. Add price: £49/month");
    console.log("5. Copy the Price ID and add to .env as STRIPE_MENTOR_MONTHLY_PRICE_ID");
    process.exit(1);
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-12-18.acacia",
  });

  try {
    console.log("Creating Mentor AI Assistant product in Stripe...");

    // Create product
    const product = await stripe.products.create({
      name: "Mentor AI Assistant",
      description: "Your AI business mentor that learns everything about your business and provides intelligent advice",
      metadata: {
        feature_module: "mentor",
      },
    });

    console.log(`✅ Product created: ${product.id}`);

    // Create monthly price (£49/month)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 4900, // £49.00 in pence
      currency: "gbp",
      recurring: {
        interval: "month",
      },
      metadata: {
        module: "mentor",
      },
    });

    console.log(`✅ Price created: ${price.id}`);
    console.log("\n📋 Add these to your .env file:");
    console.log(`STRIPE_MENTOR_MONTHLY_PRICE_ID=${price.id}`);
    console.log(`STRIPE_MENTOR_PRODUCT_ID=${product.id}`);
    console.log("\n✅ Stripe product setup complete!");
  } catch (error: any) {
    console.error("❌ Error creating Stripe product:", error.message);
    process.exit(1);
  }
}

createMentorProduct();

