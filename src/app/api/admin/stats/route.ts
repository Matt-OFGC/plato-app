import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [users, companies, recipes, ingredients] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.recipe.count(),
      prisma.ingredient.count(),
    ]);

    return NextResponse.json({
      users,
      companies,
      recipes,
      ingredients,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

