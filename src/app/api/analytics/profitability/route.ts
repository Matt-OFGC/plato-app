import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { 
  calculateRecipeProfitability, 
  calculateCategoryProfitability,
  getTopPerformingRecipes,
  getRecipesNeedingAttention 
} from "@/lib/analytics/profitability";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
    const categoryId = searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!) : undefined;
    const recipeIds = searchParams.get("recipeIds") ? searchParams.get("recipeIds")!.split(',').map(Number) : undefined;
    const reportType = searchParams.get("reportType") || "recipes"; // "recipes" | "categories" | "top" | "needs-attention"

    const filters = {
      companyId,
      startDate,
      endDate,
      categoryId,
      recipeIds,
    };

    let data;

    switch (reportType) {
      case "categories":
        data = await calculateCategoryProfitability(filters);
        break;
      case "top":
        const topLimit = parseInt(searchParams.get("limit") || "10");
        data = await getTopPerformingRecipes(companyId, topLimit, startDate, endDate);
        break;
      case "needs-attention":
        const maxFoodCost = parseFloat(searchParams.get("maxFoodCost") || "35");
        data = await getRecipesNeedingAttention(companyId, maxFoodCost, startDate, endDate);
        break;
      default:
        data = await calculateRecipeProfitability(filters);
    }

    // Serialize Decimal values to strings for JSON response
    const serializedData = JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value && typeof value === 'object' && value.isDecimal) {
          return value.toString();
        }
        return value;
      })
    );

    return NextResponse.json({
      reportType,
      data: serializedData,
      filters: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        categoryId,
        recipeIds,
      },
    });
  } catch (error) {
    console.error("Profitability analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate profitability analysis" },
      { status: 500 }
    );
  }
}
