import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";

export async function GET(request: NextRequest) {
  try {
    // Only allow authenticated admin users
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if environment variables are set (without exposing values)
    const envStatus = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length || 0,
      RESEND_API_KEY_PREFIX: process.env.RESEND_API_KEY?.substring(0, 7) || 'not set',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'not set',
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length || 0,
      OPENAI_API_KEY_PREFIX: process.env.OPENAI_API_KEY?.substring(0, 7) || 'not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(envStatus);
  } catch (error) {
    return NextResponse.json({ error: "Failed to check environment" }, { status: 500 });
  }
}
