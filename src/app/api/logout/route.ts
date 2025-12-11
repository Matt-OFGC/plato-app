import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth-simple";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Logout error", error, "Auth/Logout");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await destroySession();
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  } catch (error) {
    logger.error("Logout error", error, "Auth/Logout");
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}

