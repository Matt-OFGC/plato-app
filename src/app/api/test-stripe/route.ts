import { NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";

export async function GET() {
  try {
    // Test Stripe configuration
    const config = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      proProductId: process.env.STRIPE_PRO_PRODUCT_ID,
      proPriceId: process.env.STRIPE_PRO_PRICE_ID,
      seatProductId: process.env.STRIPE_SEAT_PRODUCT_ID,
      seatPriceId: process.env.STRIPE_SEAT_PRICE_ID,
    };

    // Test Stripe API connection
    let stripeConnection = false;
    let products: any[] = [];
    
    try {
      const stripeProducts = await stripe.products.list({ limit: 5 });
      stripeConnection = true;
      products = stripeProducts.data.map(p => ({
        id: p.id,
        name: p.name,
        active: p.active,
      }));
    } catch (error) {
      console.error("Stripe connection error:", error);
    }

    return NextResponse.json({
      success: true,
      config,
      stripeConnection,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        config: {
          hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
          hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
          proProductId: process.env.STRIPE_PRO_PRODUCT_ID,
          proPriceId: process.env.STRIPE_PRO_PRICE_ID,
          seatProductId: process.env.STRIPE_SEAT_PRODUCT_ID,
          seatPriceId: process.env.STRIPE_SEAT_PRICE_ID,
        }
      },
      { status: 500 }
    );
  }
}
