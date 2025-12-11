import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { logger } from "@/lib/logger";
import { logSystemEvent } from "@/lib/audit-log";

/**
 * Endpoint for users to report issues
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    const body = await request.json();
    const { description, context } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const userId = session?.id || null;
    const userEmail = session?.email || "anonymous";

    // Log the issue report
    await logSystemEvent(
      "USER_ISSUE_REPORT",
      "Support",
      userId?.toString() || "anonymous",
      {
        userId,
        userEmail,
        description,
        context,
        timestamp: new Date().toISOString(),
      }
    );

    logger.warn("User issue report received", {
      userId,
      userEmail,
      description,
      context,
    }, "Support");

    return NextResponse.json({
      success: true,
      message: "Issue report received. Thank you for your feedback!",
    });
  } catch (error) {
    logger.error("Error processing issue report", error, "Support");
    return NextResponse.json(
      {
        error: "Failed to submit report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
