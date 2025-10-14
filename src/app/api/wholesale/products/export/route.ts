import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

/**
 * Export wholesale products as CSV
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const products = await prisma.wholesaleProduct.findMany({
      where: { companyId: parseInt(companyId) },
      include: {
        recipe: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Generate CSV
    const header = "name,description,unit,price,currency,category,isActive,notes,recipeLink,imageUrl";
    const rows = products.map((product) => {
      const name = product.name || product.recipe?.name || "";
      const description = (product.description || "").replace(/,/g, ";");
      const unit = product.unit || "";
      const price = product.price.toString();
      const currency = product.currency;
      const category = product.category || "";
      const isActive = product.isActive ? "true" : "false";
      const notes = (product.notes || "").replace(/,/g, ";");
      const recipeLink = product.recipeId ? `Recipe ID: ${product.recipeId}` : "";
      const imageUrl = product.imageUrl || "";

      return `"${name}","${description}","${unit}","${price}","${currency}","${category}","${isActive}","${notes}","${recipeLink}","${imageUrl}"`;
    });

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="wholesale-products-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("Export products error:", error);
    return NextResponse.json(
      { error: "Failed to export products" },
      { status: 500 }
    );
  }
}

