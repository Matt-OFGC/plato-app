import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/oauth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const providers = getAvailableProviders();
    return NextResponse.json({ providers });
  } catch (error) {
    logger.error("Error getting OAuth providers", error, "Auth/OAuth");
    return NextResponse.json({ providers: [] });
  }
}

