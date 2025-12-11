import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { runRepairJobManually } from "@/lib/jobs/repair-memberships";
import { logger } from "@/lib/logger";

/**
 * Admin endpoint to manually trigger membership repair job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    // Check if user is admin
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    logger.info('Manual repair job triggered', {
      triggeredBy: session.id,
      email: session.email,
    }, 'Admin');

    const stats = await runRepairJobManually();

    return NextResponse.json({
      success: true,
      message: 'Repair job completed',
      stats,
    });
  } catch (error) {
    logger.error('Error running repair job', error, 'Admin');
    return NextResponse.json(
      { 
        error: "Failed to run repair job",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
