import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/oauth";

export async function GET() {
  try {
    const providers = getAvailableProviders();
    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error getting OAuth providers:", error);
    return NextResponse.json({ providers: [] });
  }
}

