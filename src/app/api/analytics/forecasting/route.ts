import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import {
  forecastIngredientUsage,
  forecastSales,
  generateReorderSuggestions,
} from "@/lib/analytics/forecasting";
import { handleApiError } from "@/lib/api-error-handler";
import { createOptimizedResponse, serializeResponse } from "@/lib/api-optimization";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const forecastType = searchParams.get("forecastType") || "ingredients"; // "ingredients" | "sales" | "reorder"
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
    const recipeIds = searchParams.get("recipeIds") ? searchParams.get("recipeIds")!.split(',').map(Number) : undefined;
    const ingredientIds = searchParams.get("ingredientIds") ? searchParams.get("ingredientIds")!.split(',').map(Number) : undefined;

    const filters = {
      companyId,
      startDate,
      endDate,
      recipeIds,
      ingredientIds,
    };

    let data;

    switch (forecastType) {
      case "sales":
        data = await forecastSales(filters);
        break;
      case "reorder":
        const maxDays = parseInt(searchParams.get("maxDays") || "7");
        data = await generateReorderSuggestions(companyId, maxDays);
        break;
      default:
        data = await forecastIngredientUsage(filters);
    }

    // Serialize Decimal values to strings for JSON response
    const serializedData = serializeResponse(data);

    return createOptimizedResponse(
      {
        forecastType,
        data: serializedData,
        filters: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          recipeIds,
          ingredientIds,
        },
      },
      { cacheType: 'dynamic' } // Forecasts change frequently
    );
  } catch (error) {
    return handleApiError(error, 'Analytics/Forecasting');
  }
}
