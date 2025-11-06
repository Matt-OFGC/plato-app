import { prisma } from "@/lib/prisma";

export type Permission =
  // Staff Management
  | "staff:view"
  | "staff:edit"
  | "staff:create"
  | "staff:delete"
  | "staff:assign"
  // Training
  | "training:view"
  | "training:create"
  | "training:edit"
  | "training:delete"
  | "training:assign"
  | "training:signoff"
  // Production
  | "production:view"
  | "production:create"
  | "production:edit"
  | "production:assign"
  | "production:complete"
  // Cleaning Jobs
  | "cleaning:view"
  | "cleaning:create"
  | "cleaning:assign"
  | "cleaning:complete"
  // Financial
  | "financial:wages:view"
  | "financial:wages:edit"
  | "financial:expenses:view"
  | "financial:expenses:edit"
  | "financial:turnover:view"
  | "financial:turnover:edit"
  | "financial:reports:view"
  | "financial:reports:export"
  // Recipes & Ingredients
  | "recipes:view"
  | "recipes:create"
  | "recipes:edit"
  | "recipes:delete"
  | "ingredients:view"
  | "ingredients:edit"
  // Timesheets & Scheduling
  | "timesheets:view"
  | "timesheets:approve"
  | "scheduling:view"
  | "scheduling:create"
  | "scheduling:edit"
  // Company Settings
  | "settings:view"
  | "settings:edit"
  | "team:manage"
  | "billing:view"
  | "billing:edit";

/**
 * Check if a user has a specific permission in a company
 */
export async function checkPermission(
  userId: number,
  companyId: number,
  permission: Permission
): Promise<boolean> {
  try {
    // Get user's membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!membership || !membership.isActive) {
      return false;
    }

    // Owner always has all permissions
    if (membership.role === "OWNER") {
      return true;
    }

    // Check custom role permissions
    if (membership.roleId && membership.role) {
      return membership.role.permissions.some(
        (p) => p.permission === permission
      );
    }

    // Fallback to legacy role system
    return checkLegacyPermission(membership.role, permission);
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

/**
 * Check permissions using legacy role system
 */
function checkLegacyPermission(
  role: string,
  permission: Permission
): boolean {
  // Legacy role mappings
  switch (role) {
    case "OWNER":
      return true; // Owner has all permissions
    case "ADMIN":
      // Admin has most permissions except financial turnover
      return !permission.startsWith("financial:turnover");
    case "EDITOR":
      return (
        permission.startsWith("recipes:") ||
        permission.startsWith("ingredients:") ||
        permission.startsWith("production:view") ||
        permission.startsWith("training:view")
      );
    case "VIEWER":
      return permission.endsWith(":view");
    default:
      return false;
  }
}

/**
 * Get all permissions for a user in a company
 */
export async function getUserPermissions(
  userId: number,
  companyId: number
): Promise<Permission[]> {
  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!membership || !membership.isActive) {
      return [];
    }

    // Owner has all permissions
    if (membership.role === "OWNER") {
      return getAllPermissions();
    }

    // Get custom role permissions
    if (membership.roleId && membership.role) {
      return membership.role.permissions.map((p) => p.permission as Permission);
    }

    // Fallback to legacy role
    return getLegacyPermissions(membership.role);
  } catch (error) {
    console.error("Get permissions error:", error);
    return [];
  }
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): Permission[] {
  return [
    "staff:view",
    "staff:edit",
    "staff:create",
    "staff:delete",
    "staff:assign",
    "training:view",
    "training:create",
    "training:edit",
    "training:delete",
    "training:assign",
    "training:signoff",
    "production:view",
    "production:create",
    "production:edit",
    "production:assign",
    "production:complete",
    "cleaning:view",
    "cleaning:create",
    "cleaning:assign",
    "cleaning:complete",
    "financial:wages:view",
    "financial:wages:edit",
    "financial:expenses:view",
    "financial:expenses:edit",
    "financial:turnover:view",
    "financial:turnover:edit",
    "financial:reports:view",
    "financial:reports:export",
    "recipes:view",
    "recipes:create",
    "recipes:edit",
    "recipes:delete",
    "ingredients:view",
    "ingredients:edit",
    "timesheets:view",
    "timesheets:approve",
    "scheduling:view",
    "scheduling:create",
    "scheduling:edit",
    "settings:view",
    "settings:edit",
    "team:manage",
    "billing:view",
    "billing:edit",
  ];
}

/**
 * Get permissions for legacy role
 */
function getLegacyPermissions(role: string): Permission[] {
  const allPermissions = getAllPermissions();
  
  switch (role) {
    case "OWNER":
      return allPermissions;
    case "ADMIN":
      return allPermissions.filter(
        (p) => !p.startsWith("financial:turnover")
      );
    case "EDITOR":
      return allPermissions.filter(
        (p) =>
          p.startsWith("recipes:") ||
          p.startsWith("ingredients:") ||
          p === "production:view" ||
          p === "training:view"
      );
    case "VIEWER":
      return allPermissions.filter((p) => p.endsWith(":view"));
    default:
      return [];
  }
}

/**
 * Check if user can manage team members
 */
export async function canManageTeam(
  userId: number,
  companyId: number
): Promise<boolean> {
  return checkPermission(userId, companyId, "team:manage");
}

/**
 * Check if user can view financial turnover
 */
export async function canViewTurnover(
  userId: number,
  companyId: number
): Promise<boolean> {
  return checkPermission(userId, companyId, "financial:turnover:view");
}

/**
 * Check if user can view wages
 */
export async function canViewWages(
  userId: number,
  companyId: number
): Promise<boolean> {
  return checkPermission(userId, companyId, "financial:wages:view");
}

