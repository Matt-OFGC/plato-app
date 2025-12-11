import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

// Simple endpoint to check what Stripe env vars are set (without exposing values)
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check what's configured (without exposing actual values)
    const config = {
      // Core keys
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      
      // Old format (what you currently have)
      oldFormat: {
        hasProProductId: !!process.env.STRIPE_PRO_PRODUCT_ID,
        hasProPriceId: !!process.env.STRIPE_PRO_PRICE_ID,
        hasSeatProductId: !!process.env.STRIPE_SEAT_PRODUCT_ID,
        hasSeatPriceId: !!process.env.STRIPE_SEAT_PRICE_ID,
      },
      
      // New format (what code expects)
      newFormat: {
        professional: {
          hasProductId: !!process.env.STRIPE_PROFESSIONAL_PRODUCT_ID,
          hasMonthlyPriceId: !!process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
          hasAnnualPriceId: !!process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
        },
        team: {
          hasProductId: !!process.env.STRIPE_TEAM_PRODUCT_ID,
          hasMonthlyPriceId: !!process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
          hasAnnualPriceId: !!process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
        },
        business: {
          hasProductId: !!process.env.STRIPE_BUSINESS_PRODUCT_ID,
          hasMonthlyPriceId: !!process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
          hasAnnualPriceId: !!process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
        },
      },
    };

    // Determine status
    const usingOldFormat = config.oldFormat.hasProProductId || config.oldFormat.hasProPriceId;
    const usingNewFormat = config.newFormat.professional.hasProductId || 
                          config.newFormat.team.hasProductId || 
                          config.newFormat.business.hasProductId;

    return NextResponse.json({
      message: "Stripe configuration check",
      config,
      status: usingNewFormat ? "new_format" : usingOldFormat ? "old_format" : "not_configured",
      recommendation: usingOldFormat 
        ? "You're using the old format. Update to new format with monthly/annual prices. See STRIPE_CONFIGURATION_STATUS.md"
        : usingNewFormat
        ? "Using new format! Make sure all products/prices are configured."
        : "No Stripe configuration found. See STRIPE_SETUP_GUIDE.md",
    });
  } catch (error) {
    logger.error("Stripe check error", error, "Admin/StripeCheck");
    return NextResponse.json(
      { error: "Failed to check Stripe configuration" },
      { status: 500 }
    );
  }
}












