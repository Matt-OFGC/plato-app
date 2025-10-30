import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { STRIPE_CONFIG } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check environment variables (based on your stripe.ts config)
    const envVars = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      // Professional
      STRIPE_PROFESSIONAL_PRODUCT_ID: !!process.env.STRIPE_PROFESSIONAL_PRODUCT_ID,
      STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID: !!process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
      STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID: !!process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
      // Team
      STRIPE_TEAM_PRODUCT_ID: !!process.env.STRIPE_TEAM_PRODUCT_ID,
      STRIPE_TEAM_MONTHLY_PRICE_ID: !!process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
      STRIPE_TEAM_ANNUAL_PRICE_ID: !!process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
      // Business
      STRIPE_BUSINESS_PRODUCT_ID: !!process.env.STRIPE_BUSINESS_PRODUCT_ID,
      STRIPE_BUSINESS_MONTHLY_PRICE_ID: !!process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
      STRIPE_BUSINESS_ANNUAL_PRICE_ID: !!process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
    };

    // Check Stripe config
    const configStatus = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!STRIPE_CONFIG.webhookSecret,
      hasProducts: {
        professional: !!STRIPE_CONFIG.products?.professional?.monthly?.productId,
        team: !!STRIPE_CONFIG.products?.team?.monthly?.productId,
        business: !!STRIPE_CONFIG.products?.business?.monthly?.productId,
      },
      hasPrices: {
        professionalMonthly: !!STRIPE_CONFIG.products?.professional?.monthly?.priceId,
        professionalAnnual: !!STRIPE_CONFIG.products?.professional?.annual?.priceId,
        teamMonthly: !!STRIPE_CONFIG.products?.team?.monthly?.priceId,
        teamAnnual: !!STRIPE_CONFIG.products?.team?.annual?.priceId,
        businessMonthly: !!STRIPE_CONFIG.products?.business?.monthly?.priceId,
        businessAnnual: !!STRIPE_CONFIG.products?.business?.annual?.priceId,
      },
    };

    // Test Stripe connection if secret key exists
    let stripeConnection = false;
    let stripeError = null;
    let stripeProducts: any[] = [];
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = await import("stripe");
        const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-09-30.clover",
        });
        const products = await stripeClient.products.list({ limit: 10 });
        stripeConnection = true;
        stripeProducts = products.data.map(p => ({
          id: p.id,
          name: p.name,
          active: p.active,
        }));
      } catch (error) {
        stripeError = error instanceof Error ? error.message : "Unknown error";
      }
    }

    const allConfigured = 
      envVars.STRIPE_SECRET_KEY &&
      envVars.STRIPE_PUBLISHABLE_KEY &&
      envVars.STRIPE_WEBHOOK_SECRET &&
      configStatus.hasProducts.professional &&
      configStatus.hasProducts.team &&
      configStatus.hasProducts.business &&
      configStatus.hasPrices.professionalMonthly &&
      configStatus.hasPrices.teamMonthly &&
      configStatus.hasPrices.businessMonthly &&
      stripeConnection;

    return NextResponse.json({
      status: allConfigured ? "configured" : "incomplete",
      environmentVariables: envVars,
      configStatus,
      stripeConnection,
      stripeError,
      stripeProducts,
      webhookUrl: "/api/webhooks/stripe",
      instructions: allConfigured 
        ? "Stripe is fully configured! ✅"
        : "See STRIPE_SETUP_GUIDE.md for setup instructions. Missing configuration detected.",
      missingItems: !allConfigured ? {
        missingEnvVars: Object.entries(envVars).filter(([_, value]) => !value).map(([key]) => key),
        missingProducts: Object.entries(configStatus.hasProducts).filter(([_, value]) => !value).map(([key]) => key),
        missingPrices: Object.entries(configStatus.hasPrices).filter(([_, value]) => !value).map(([key]) => key),
      } : null,
    });
  } catch (error) {
    console.error("Stripe status check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check Stripe status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

