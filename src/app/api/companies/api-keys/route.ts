import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";
import crypto from "crypto";

/**
 * Generate API key for company
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
    const { companyId, name } = body;

    if (!companyId || !name) {
      return NextResponse.json(
        { error: "Company ID and key name are required" },
        { status: 400 }
      );
    }

    // Verify user has permission
    const canManage = await checkPermission(session.id, companyId, "settings:edit");
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to manage API keys" },
        { status: 403 }
      );
    }

    // Check if company has API access feature enabled
    const { isCompanyFeatureEnabled } = await import("@/lib/company-feature-flags");
    const hasApiAccess = await isCompanyFeatureEnabled(companyId, 'api_access');
    
    if (!hasApiAccess) {
      return NextResponse.json(
        { error: "API access is not enabled for this company. Enable it in company settings." },
        { status: 403 }
      );
    }

    // Generate API key
    const apiKey = `plato_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Store API key (would need APIKey model in production)
    // For now, we'll just return it (user must save it securely)
    
    logger.info(`API key generated for company`, {
      companyId,
      keyName: name,
      generatedBy: session.id,
    }, "Companies");

    return NextResponse.json({
      success: true,
      apiKey, // In production, only show this once
      keyHash, // Store this in database
      name,
      message: "API key generated. Save it securely - you won't be able to see it again.",
    });
  } catch (error) {
    logger.error("Error generating API key", error, "Companies");
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}

/**
 * List API keys for company
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

    // In production, fetch from APIKey model
    // For now, return empty array
    return NextResponse.json({
      success: true,
      keys: [],
      message: "API keys feature coming soon",
    });
  } catch (error) {
    logger.error("Error fetching API keys", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}
