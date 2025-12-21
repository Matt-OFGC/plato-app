import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { storeInvitationMetadata, getInvitationMetadata } from "@/lib/invitation-metadata-store";

// Store invitation metadata (staff profile data)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId, profileData } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID required" }, { status: 400 });
    }

    // Verify invitation exists and belongs to a company the user has access to
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        company: {
          include: {
            memberships: {
              where: { userId: session.id, isActive: true },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if user has access to this company
    if (invitation.company.memberships.length === 0 && invitation.invitedBy !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Store metadata
    storeInvitationMetadata(invitationId, profileData);
    
    return NextResponse.json({ 
      success: true,
      message: "Metadata stored",
    });
  } catch (error) {
    logger.error("Store invitation metadata error", error, "Team/InvitationMetadata");
    return NextResponse.json(
      { error: "Failed to store metadata" },
      { status: 500 }
    );
  }
}

// Get invitation metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID required" }, { status: 400 });
    }

    const profileData = getInvitationMetadata(parseInt(invitationId));
    return NextResponse.json({ profileData: profileData || null });
  } catch (error) {
    logger.error("Get invitation metadata error", error, "Team/InvitationMetadata");
    return NextResponse.json(
      { error: "Failed to get metadata" },
      { status: 500 }
    );
  }
}
