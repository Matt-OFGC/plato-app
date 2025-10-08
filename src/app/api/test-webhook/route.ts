import { NextRequest, NextResponse } from "next/server";
import { STRIPE_CONFIG } from "@/lib/stripe";

export async function GET() {
  return NextResponse.json({
    message: "Webhook test endpoint",
    stripeConfigured: {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!STRIPE_CONFIG.webhookSecret,
      hasProductId: !!STRIPE_CONFIG.products.pro.productId,
      hasPriceId: !!STRIPE_CONFIG.products.pro.priceId,
    },
    webhookUrl: "/api/webhooks/stripe",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    
    return NextResponse.json({
      message: "Test webhook received",
      hasBody: !!body,
      hasSignature: !!signature,
      bodyLength: body.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Test webhook failed", details: error },
      { status: 500 }
    );
  }
}
