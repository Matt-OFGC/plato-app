import { prisma } from "@/lib/prisma";

export type EntityType =
  | "staff"
  | "training"
  | "recipe"
  | "production"
  | "cleaning"
  | "timesheet"
  | "shift";

export interface RelatedEntity {
  type: EntityType;
  id: number;
  name: string;
  link: string;
}

/**
 * Get all entities related to a staff member
 */
export async function getStaffRelations(
  membershipId: number
): Promise<RelatedEntity[]> {
  const relations: RelatedEntity[] = [];

  // Training records
  const trainingRecords = await prisma.trainingRecord.findMany({
    where: { membershipId },
    include: {
      module: {
        select: { id: true, title: true },
      },
    },
  });

  trainingRecords.forEach((record) => {
    relations.push({
      type: "training",
      id: record.moduleId,
      name: record.module.title,
      link: `/dashboard/training/modules/${record.moduleId}`,
    });
  });

  // Cleaning jobs
  const cleaningJobs = await prisma.cleaningJob.findMany({
    where: { membershipId },
    select: { id: true, name: true },
  });

  cleaningJobs.forEach((job) => {
    relations.push({
      type: "cleaning",
      id: job.id,
      name: job.name,
      link: `/dashboard/team/cleaning`,
    });
  });

  // Production assignments
  const productionAssignments = await prisma.productionJobAssignment.findMany({
    where: { membershipId },
    include: {
      productionItem: {
        include: {
          recipe: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  productionAssignments.forEach((assignment) => {
    relations.push({
      type: "production",
      id: assignment.productionItem.recipe.id,
      name: assignment.productionItem.recipe.name,
      link: `/dashboard/recipes/${assignment.productionItem.recipe.id}`,
    });
  });

  return relations;
}

/**
 * Get all entities related to a training module
 */
export async function getTrainingRelations(
  moduleId: number
): Promise<RelatedEntity[]> {
  const relations: RelatedEntity[] = [];

  // Linked recipes
  const recipeLinks = await prisma.trainingModuleRecipe.findMany({
    where: { moduleId },
    include: {
      recipe: {
        select: { id: true, name: true },
      },
    },
  });

  recipeLinks.forEach((link) => {
    relations.push({
      type: "recipe",
      id: link.recipeId,
      name: link.recipe.name,
      link: `/dashboard/recipes/${link.recipeId}`,
    });
  });

  // Staff who completed training
  const completedRecords = await prisma.trainingRecord.findMany({
    where: {
      moduleId,
      status: "completed",
    },
    include: {
      membership: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  completedRecords.forEach((record) => {
    relations.push({
      type: "staff",
      id: record.membershipId,
      name: record.membership.user.name || "Unknown",
      link: `/dashboard/team/${record.membershipId}`,
    });
  });

  return relations;
}

/**
 * Get all entities related to a recipe
 */
export async function getRecipeRelations(
  recipeId: number
): Promise<RelatedEntity[]> {
  const relations: RelatedEntity[] = [];

  // Training modules
  const trainingLinks = await prisma.trainingModuleRecipe.findMany({
    where: { recipeId },
    include: {
      module: {
        select: { id: true, title: true },
      },
    },
  });

  trainingLinks.forEach((link) => {
    relations.push({
      type: "training",
      id: link.moduleId,
      name: link.module.title,
      link: `/dashboard/training/modules/${link.moduleId}`,
    });
  });

  // Production assignments
  const productionItems = await prisma.productionItem.findMany({
    where: { recipeId },
    include: {
      assignments: {
        include: {
          membership: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  productionItems.forEach((item) => {
    item.assignments.forEach((assignment) => {
      relations.push({
        type: "staff",
        id: assignment.membershipId,
        name: assignment.membership.user.name || "Unknown",
        link: `/dashboard/team/${assignment.membershipId}`,
      });
    });
  });

  return relations;
}

/**
 * Get all entities related to a production plan/item
 */
export async function getProductionRelations(
  productionItemId: number
): Promise<RelatedEntity[]> {
  const relations: RelatedEntity[] = [];

  // Assigned staff
  const assignments = await prisma.productionJobAssignment.findMany({
    where: { productionItemId },
    include: {
      membership: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  assignments.forEach((assignment) => {
    relations.push({
      type: "staff",
      id: assignment.membershipId,
      name: assignment.membership.user.name || "Unknown",
      link: `/dashboard/team/${assignment.membershipId}`,
    });
  });

  // Related cleaning jobs
  const productionItem = await prisma.productionItem.findUnique({
    where: { id: productionItemId },
    include: {
      plan: {
        include: {
          cleaningJobs: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (productionItem?.plan) {
    productionItem.plan.cleaningJobs.forEach((job) => {
      relations.push({
        type: "cleaning",
        id: job.id,
        name: job.name,
        link: `/dashboard/team/cleaning`,
      });
    });
  }

  return relations;
}

/**
 * Generic function to get relations for any entity type
 */
export async function getEntityRelations(
  entityType: EntityType,
  entityId: number
): Promise<RelatedEntity[]> {
  switch (entityType) {
    case "staff":
      return getStaffRelations(entityId);
    case "training":
      return getTrainingRelations(entityId);
    case "recipe":
      return getRecipeRelations(entityId);
    case "production":
      return getProductionRelations(entityId);
    default:
      return [];
  }
}

