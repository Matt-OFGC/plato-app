import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!table) {
      return NextResponse.json({ error: "Table parameter required" }, { status: 400 });
    }

    // Map table names to Prisma models (in lowercase as Prisma uses camelCase)
    const tableMap: Record<string, any> = {
      User: prisma.user,
      Company: prisma.company,
      Recipe: prisma.recipe,
      Ingredient: prisma.ingredient,
      Category: prisma.category,
      Supplier: prisma.supplier,
      Membership: prisma.membership,
      ProductionPlan: prisma.productionPlan,
      WholesaleCustomer: prisma.wholesaleCustomer,
      WholesaleOrder: prisma.wholesaleOrder,
      ActivityLog: prisma.activityLog,
    };

    const model = tableMap[table];
    if (!model) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Fetch data with pagination
    const [data, total] = await Promise.all([
      model.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      model.count(),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Database browser error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
