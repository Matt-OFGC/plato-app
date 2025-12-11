import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }, // Only select id to minimize data transfer
    });

    return NextResponse.json({
      exists: !!existingUser,
    });
  } catch (error) {
    logger.error("Email check API error", error, "Auth/CheckEmail");
    // Don't block registration on error - return exists: false
    return NextResponse.json({ exists: false });
  }
}
