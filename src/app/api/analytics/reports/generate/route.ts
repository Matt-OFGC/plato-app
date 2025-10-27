import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { calculateRecipeProfitability } from "@/lib/analytics/profitability";
import { analyzeRevenueTrends } from "@/lib/analytics/trends";
import { forecastIngredientUsage } from "@/lib/analytics/forecasting";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");
    
    if (!reportId) {
      return NextResponse.json({ error: "Report ID required" }, { status: 400 });
    }

    // Get custom report configuration
    const report = await prisma.customReport.findUnique({
      where: {
        id: parseInt(reportId),
      },
    });

    if (!report || report.companyId !== companyId || !report.isActive) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Parse report configuration
    const metrics = report.metrics as string[];
    const filters = report.filters as any;
    const grouping = report.grouping as any;
    const dateRange = report.dateRange as any;

    // Apply filters
    const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : undefined;
    const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : undefined;
    const categoryId = filters?.categoryId;
    const recipeIds = filters?.recipeIds;

    const queryFilters = {
      companyId,
      startDate,
      endDate,
      categoryId,
      recipeIds,
    };

    // Generate data based on report type
    let data: any;

    switch (report.reportType) {
      case "profitability":
        data = await calculateRecipeProfitability(queryFilters);
        break;
      case "trends":
        data = await analyzeRevenueTrends({
          ...queryFilters,
          period: (grouping?.period as 'daily' | 'weekly' | 'monthly') || 'monthly',
        });
        break;
      case "forecasting":
        data = await forecastIngredientUsage(queryFilters);
        break;
      default:
        data = await calculateRecipeProfitability(queryFilters);
    }

    // Update last run timestamp
    await prisma.customReport.update({
      where: { id: report.id },
      data: { lastRunAt: new Date() },
    });

    // Serialize Decimal values
    const serializedData = JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value && typeof value === 'object' && value.isDecimal) {
          return value.toString();
        }
        return value;
      })
    );

    return NextResponse.json({
      report: {
        id: report.id,
        name: report.name,
        description: report.description,
        reportType: report.reportType,
      },
      data: serializedData,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: queryFilters,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, user } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, reportType, metrics, filters, grouping, dateRange } = body;

    // Validate required fields
    if (!name || !reportType || !metrics) {
      return NextResponse.json(
        { error: "Name, report type, and metrics are required" },
        { status: 400 }
      );
    }

    // Create custom report
    const report = await prisma.customReport.create({
      data: {
        companyId,
        createdBy: user!.id,
        name,
        description: description || null,
        reportType,
        metrics: metrics as any,
        filters: filters || null,
        grouping: grouping || null,
        dateRange: dateRange || null,
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report creation error:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
