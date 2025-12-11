import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";

/**
 * Validate company settings and provide recommendations
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
    const { companyId, settings } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await hasCompanyAccess(session.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Validate company name
    if (!settings.name || settings.name.trim().length < 2) {
      issues.push("Company name must be at least 2 characters");
    }

    if (settings.name && settings.name.length > 100) {
      issues.push("Company name must be less than 100 characters");
    }

    // Validate business type
    if (!settings.businessType) {
      warnings.push("Business type is recommended for better categorization");
    }

    // Validate country
    if (!settings.country) {
      warnings.push("Country helps with currency and regional settings");
    }

    // Validate contact info
    if (!settings.email && !settings.phone) {
      warnings.push("At least one contact method (email or phone) is recommended");
    }

    // Validate website URL format
    if (settings.website && !settings.website.match(/^https?:\/\/.+/)) {
      issues.push("Website URL must start with http:// or https://");
    }

    // Validate email format
    if (settings.email && !settings.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      issues.push("Email format is invalid");
    }

    // Check completeness
    const requiredFields = ['name'];
    const recommendedFields = ['businessType', 'country', 'phone', 'email'];
    
    const missingRequired = requiredFields.filter(field => !settings[field]);
    const missingRecommended = recommendedFields.filter(field => !settings[field]);

    if (missingRequired.length > 0) {
      issues.push(`Missing required fields: ${missingRequired.join(', ')}`);
    }

    if (missingRecommended.length > 0) {
      recommendations.push(`Consider adding: ${missingRecommended.join(', ')}`);
    }

    // Calculate completeness score
    const totalFields = requiredFields.length + recommendedFields.length;
    const completedFields = [...requiredFields, ...recommendedFields].filter(
      field => settings[field] && settings[field].toString().trim().length > 0
    ).length;
    const completenessScore = Math.round((completedFields / totalFields) * 100);

    return NextResponse.json({
      success: true,
      valid: issues.length === 0,
      completenessScore,
      issues,
      warnings,
      recommendations,
    });
  } catch (error) {
    logger.error("Error validating company settings", error, "Companies");
    return NextResponse.json(
      { error: "Failed to validate settings" },
      { status: 500 }
    );
  }
}
