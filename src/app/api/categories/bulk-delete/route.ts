import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 403 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty IDs array" },
        { status: 400 }
      );
    }

    // Delete categories that belong to the user's company
    const result = await prisma.category.deleteMany({
      where: {
        id: { in: ids },
        companyId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} categor${result.count === 1 ? 'y' : 'ies'}` 
    });
  } catch (error) {
    console.error("Bulk delete categories error:", error);
    return NextResponse.json(
      { error: "Failed to delete categories" },
      { status: 500 }
    );
  }
}

