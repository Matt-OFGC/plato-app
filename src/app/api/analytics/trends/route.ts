import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import {
  analyzeRevenueTrends,
  analyzeProductionTrends,
  analyzeIngredientCostTrends,
  detectSeasonalPatterns,
  compareYearOverYear,
} from "@/lib/analytics/trends";
import { handleApiError } from "@/lib/api-error-handler";
import { createOptimizedResponse, serializeResponse } from "@/lib/api-optimization";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") || "revenue"; // "revenue" | "production" | "ingredient_costs"
    const period = (searchParams.get("period") as 'daily' | 'weekly' | 'monthly') || "monthly";
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to last 90 days
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date();
    const recipeIds = searchParams.get("recipeIds") ? searchParams.get("recipeIds")!.split(',').map(Number) : undefined;
    const categories = searchParams.get("categories") ? searchParams.get("categories")!.split(',') : undefined;
    const analysisType = searchParams.get("analysisType") || "trends"; // "trends" | "seasonal" | "yoy"

    const filters = {
      companyId,
      startDate,
      endDate,
      recipeIds,
      categories,
      period,
    };

    let data;

    switch (analysisType) {
      case "seasonal":
        data = await detectSeasonalPatterns(companyId, recipeIds);
        break;
      case "yoy":
        const currentYear = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        data = await compareYearOverYear(companyId, metric as 'revenue' | 'production' | 'costs', currentYear);
        break;
      default:
        // Trend analysis
        switch (metric) {
          case "revenue":
            data = await analyzeRevenueTrends(filters);
            break;
          case "production":
            data = await analyzeProductionTrends(filters);
            break;
          case "ingredient_costs":
            data = await analyzeIngredientCostTrends(filters);
            break;
          default:
            data = await analyzeRevenueTrends(filters);
        }
    }

    // Serialize Decimal values to strings for JSON response
    const serializedData = serializeResponse(data);

    return createOptimizedResponse(
      {
        metric,
        period,
        analysisType,
        data: serializedData,
        filters: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          recipeIds,
          categories,
        },
      },
      { cacheType: 'dynamic' } // Trends change frequently
    );
  } catch (error) {
    return handleApiError(error, 'Analytics/Trends');
  }
}
