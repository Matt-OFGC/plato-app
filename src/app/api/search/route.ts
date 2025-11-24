import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { getAppFromRoute, getAppAwareRoute } from "@/lib/app-routes";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";
import type { App } from "@/lib/apps/types";

export interface SearchResult {
  type: string;
  id: number;
  name: string;
  link: string;
  description?: string;
}

// Global search across all entities
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const appParam = searchParams.get("app") as App | null;

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Detect app from query param or referer
    let app: App | null = appParam;
    if (!app) {
      const referer = request.headers.get("referer");
      if (referer) {
        try {
          const url = new URL(referer);
          app = getAppFromRoute(url.pathname);
        } catch {
          // Invalid URL, ignore
        }
      }
    }

    const searchTerm = `%${query}%`;
    const results: SearchResult[] = [];
    
    // Helper function to generate app-aware links
    const getAppAwareLink = (path: string): string => {
      return getAppAwareRoute(path, app);
    };

    // OPTIMIZATION: Run all searches in parallel for better performance
    const [
      staffMembers,
      recipes,
      trainingModules,
      cleaningJobs,
      productionPlans,
    ] = await Promise.all([
      // Search staff (users)
      prisma.membership.findMany({
      where: {
        companyId,
        isActive: true,
        user: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: 5,
      }),
      // Search recipes
      prisma.recipe.findMany({
      where: {
        companyId,
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
      }),
      // Search training modules
      prisma.trainingModule.findMany({
      where: {
        companyId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      }),
      // Search cleaning jobs
      prisma.cleaningJob.findMany({
      where: {
        companyId,
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
      }),
      // Search production plans
      prisma.productionPlan.findMany({
      where: {
        companyId,
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
      }),
    ]);

    // Process results
    staffMembers.forEach((member) => {
      results.push({
        type: "staff",
        id: member.id,
        name: member.user.name || member.user.email,
        link: getAppAwareLink(`/dashboard/team/${member.id}`),
        description: member.user.email,
      });
    });

    recipes.forEach((recipe) => {
      results.push({
        type: "recipe",
        id: recipe.id,
        name: recipe.name,
        link: getAppAwareLink(`/dashboard/recipes/${recipe.id}`),
        description: recipe.description || undefined,
      });
    });

    trainingModules.forEach((module) => {
      results.push({
        type: "training",
        id: module.id,
        name: module.title,
        link: getAppAwareLink(`/dashboard/training/modules/${module.id}`),
        description: module.description || undefined,
      });
    });

    cleaningJobs.forEach((job) => {
      results.push({
        type: "cleaning",
        id: job.id,
        name: job.name,
        link: getAppAwareLink(`/dashboard/team/cleaning`),
        description: job.description || undefined,
      });
    });

    productionPlans.forEach((plan) => {
      results.push({
        type: "production",
        id: plan.id,
        name: plan.name,
        link: getAppAwareLink(`/dashboard/production/view/${plan.id}`),
        description: plan.notes || undefined,
      });
    });

    return createOptimizedResponse({ results }, {
      cacheType: 'dynamic',
      compression: true,
    });
  } catch (error) {
    logger.error("Search error", error, "Search");
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

