import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeMemberships = searchParams.get("includeMemberships") === "true";

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isActive: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        createdAt: true,
        lastLoginAt: true,
        memberships: includeMemberships ? {
          select: {
            id: true,
            role: true,
            isActive: true,
            pin: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        } : undefined,
        _count: {
          select: {
            memberships: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info(`[Admin API] Fetched ${users.length} users from database`, { count: users.length }, "Admin/Users");

    // Add account type logic based on email patterns
    const usersWithAccountType = users.map(user => ({
      ...user,
      accountType: user.email.includes('demo') || user.email.includes('test') || user.email.includes('example') ? 'demo' : 'real'
    }));

    return NextResponse.json({ users: usersWithAccountType });
  } catch (error) {
    logger.error("Admin users API error", error, "Admin/Users");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to fetch users",
        details: errorMessage,
        users: [] // Return empty array on error
      },
      { status: 500 }
    );
  }
}

