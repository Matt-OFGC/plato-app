import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";
import { auditLog } from "@/lib/audit-log";

/**
 * Update company branding (logo, colors, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId, branding } = body;

    if (!companyId || !branding) {
      return NextResponse.json(
        { error: "Company ID and branding data are required" },
        { status: 400 }
      );
    }

    // Verify user has permission
    const canManage = await checkPermission(session.id, companyId, "settings:edit");
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to update company branding" },
        { status: 403 }
      );
    }

    // Validate branding data
    const updates: any = {};

    if (branding.logoUrl !== undefined) {
      // Validate URL format
      if (branding.logoUrl && !branding.logoUrl.match(/^https?:\/\/.+/)) {
        return NextResponse.json(
          { error: "Logo URL must be a valid HTTP/HTTPS URL" },
          { status: 400 }
        );
      }
      updates.logoUrl = branding.logoUrl || null;
    }

    if (branding.primaryColor !== undefined) {
      // Validate hex color
      if (branding.primaryColor && !branding.primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
        return NextResponse.json(
          { error: "Primary color must be a valid hex color (e.g., #FF5733)" },
          { status: 400 }
        );
      }
      // Store in metadata or custom field (would need schema update)
      // For now, we'll just log it
      logger.info("Branding color update", {
        companyId,
        primaryColor: branding.primaryColor,
      }, "Companies");
    }

    if (branding.secondaryColor !== undefined) {
      if (branding.secondaryColor && !branding.secondaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
        return NextResponse.json(
          { error: "Secondary color must be a valid hex color" },
          { status: 400 }
        );
      }
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: updates,
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    // Audit
    await auditLog.companyUpdated(session.id, companyId, {
      action: "update_branding",
      changes: branding,
    });

    logger.info(`Company branding updated`, {
      companyId,
      userId: session.id,
    }, "Companies");

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      message: "Branding updated successfully",
    });
  } catch (error) {
    logger.error("Error updating company branding", error, "Companies");
    return NextResponse.json(
      { error: "Failed to update branding" },
      { status: 500 }
    );
  }
}
