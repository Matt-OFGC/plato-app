import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    logger.debug("Test Stripe Webhook received", { body }, "Stripe/Webhook");
    
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Test webhook error", error, "Stripe/Webhook");
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
