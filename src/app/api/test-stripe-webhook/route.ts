import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log("Test Stripe Webhook received:", body);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Test webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
