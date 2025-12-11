import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";
import { 
  isCompanyFeatureEnabled, 
  setCompanyFeatureFlag, 
  getCompanyFeatureFlags 
} from "@/lib/company-feature-flags";

/**
 * Get company feature flags
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '0');

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const { hasCompanyAccess } = await import("@/lib/current");
    const hasAccess = await hasCompanyAccess(session.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    const flags = await getCompanyFeatureFlags(companyId);

    return NextResponse.json({
      success: true,
      flags,
    });
  } catch (error) {
    logger.error("Error fetching company feature flags", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 }
    );
  }
}

/**
 * Update company feature flag
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
    const { companyId, feature, enabled, config } = body;

    if (!companyId || !feature || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: "Company ID, feature name, and enabled status are required" },
        { status: 400 }
      );
    }

    // Verify user has permission (admin/owner only)
    const canManage = await checkPermission(session.id, companyId, "settings:edit");
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to manage company features" },
        { status: 403 }
      );
    }

    await setCompanyFeatureFlag(companyId, feature, enabled, config);

    return NextResponse.json({
      success: true,
      message: `Feature "${feature}" ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    logger.error("Error updating company feature flag", error, "Companies");
    return NextResponse.json(
      { error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}
