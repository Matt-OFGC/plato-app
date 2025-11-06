import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";

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

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query}%`;
    const results: SearchResult[] = [];

    // Search staff (users)
    const staffMembers = await prisma.membership.findMany({
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
    });

    staffMembers.forEach((member) => {
      results.push({
        type: "staff",
        id: member.id,
        name: member.user.name || member.user.email,
        link: `/dashboard/team/${member.id}`,
        description: member.user.email,
      });
    });

    // Search recipes
    const recipes = await prisma.recipe.findMany({
      where: {
        companyId,
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
    });

    recipes.forEach((recipe) => {
      results.push({
        type: "recipe",
        id: recipe.id,
        name: recipe.name,
        link: `/dashboard/recipes/${recipe.id}`,
        description: recipe.description || undefined,
      });
    });

    // Search training modules
    const trainingModules = await prisma.trainingModule.findMany({
      where: {
        companyId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    trainingModules.forEach((module) => {
      results.push({
        type: "training",
        id: module.id,
        name: module.title,
        link: `/dashboard/training/modules/${module.id}`,
        description: module.description || undefined,
      });
    });

    // Search cleaning jobs
    const cleaningJobs = await prisma.cleaningJob.findMany({
      where: {
        companyId,
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
    });

    cleaningJobs.forEach((job) => {
      results.push({
        type: "cleaning",
        id: job.id,
        name: job.name,
        link: `/dashboard/team/cleaning`,
        description: job.description || undefined,
      });
    });

    // Search production plans
    const productionPlans = await prisma.productionPlan.findMany({
      where: {
        companyId,
        name: { contains: query, mode: "insensitive" },
      },
      take: 5,
    });

    productionPlans.forEach((plan) => {
      results.push({
        type: "production",
        id: plan.id,
        name: plan.name,
        link: `/dashboard/production/view/${plan.id}`,
        description: plan.notes || undefined,
      });
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

