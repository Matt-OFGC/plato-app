import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        country: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            recipes: true,
            ingredients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Admin companies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

