import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all memberships (active and inactive)
    const allMemberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            _count: {
              select: {
                memberships: true,
                recipes: true,
                ingredients: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group companies by name to find duplicates
    const companiesByName = new Map<string, typeof allMemberships>();
    allMemberships.forEach((membership) => {
      const name = membership.company.name.toLowerCase().trim();
      if (!companiesByName.has(name)) {
        companiesByName.set(name, []);
      }
      companiesByName.get(name)!.push(membership);
    });

    const duplicates = Array.from(companiesByName.entries())
      .filter(([_, memberships]) => memberships.length > 1)
      .map(([name, memberships]) => ({
        name,
        companies: memberships.map((m) => ({
          companyId: m.company.id,
          companyName: m.company.name,
          role: m.role,
          isActive: m.isActive,
          membershipId: m.id,
          createdAt: m.company.createdAt,
          recipeCount: m.company._count.recipes,
          ingredientCount: m.company._count.ingredients,
          memberCount: m.company._count.memberships,
        })),
      }));

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      totalMemberships: allMemberships.length,
      activeMemberships: allMemberships.filter((m) => m.isActive).length,
      allMemberships: allMemberships.map((m) => ({
        membershipId: m.id,
        companyId: m.company.id,
        companyName: m.company.name,
        role: m.role,
        isActive: m.isActive,
        createdAt: m.company.createdAt,
        recipeCount: m.company._count.recipes,
        ingredientCount: m.company._count.ingredients,
        memberCount: m.company._count.memberships,
      })),
      duplicates,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch companies", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

