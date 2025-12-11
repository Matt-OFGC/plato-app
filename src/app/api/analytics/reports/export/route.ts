import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { calculateRecipeProfitability } from "@/lib/analytics/profitability";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv"; // "csv" | "excel"
    const dataType = searchParams.get("dataType") || "profitability"; // "profitability" | "trends"
    
    // Get filter parameters
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

    // Fetch data based on type
    let data: any;
    let filename: string;

    if (dataType === "profitability") {
      data = await calculateRecipeProfitability({
        companyId,
        startDate,
        endDate,
      });
      filename = `profitability-report-${new Date().toISOString().split("T")[0]}`;
    } else {
      // Default to profitability
      data = await calculateRecipeProfitability({
        companyId,
        startDate,
        endDate,
      });
      filename = `report-${new Date().toISOString().split("T")[0]}`;
    }

    // Convert to flat array for export
    const exportData = data.map((item: any) => ({
      Name: item.recipeName || item.name,
      Category: item.category || "",
      "Total Revenue": item.totalRevenue?.toString() || "0",
      "Total Costs": item.totalCosts?.toString() || "0",
      "Gross Profit": item.grossProfit?.toString() || "0",
      "Gross Margin %": item.grossMargin?.toString() || "0",
      "Food Cost %": item.foodCostPercentage?.toString() || "0",
      "Selling Price": item.sellingPrice?.toString() || "",
      "Batches Produced": item.batchesProduced || 0,
    }));

    if (format === "excel") {
      // Generate Excel file
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const maxWidths = Object.keys(exportData[0] || {}).map((key, index) => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet["!cols"] = maxWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      
      // Convert to buffer
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      
      // Return as response
      return new NextResponse(Buffer.from(excelBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    } else {
      // Generate CSV
      const csv = Papa.unparse(exportData);
      
      // Return as response
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8;",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }
  } catch (error) {
    logger.error("Export error", error, "Analytics/Reports");
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
