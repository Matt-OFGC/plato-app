import { prisma } from "@/lib/prisma";
import { canUseAI } from "@/lib/subscription-simple";

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

    // ADMIN and OWNER (backward compatibility) always have all permissions
    if (membership.role === "ADMIN" || membership.role === "OWNER") {
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
 * Maps old roles to new simplified roles:
 * OWNER/ADMIN → ADMIN (all permissions)
 * EDITOR → MANAGER (all permissions except AI)
 * VIEWER → EMPLOYEE (view-only)
 */
function checkLegacyPermission(
  role: string,
  permission: Permission
): boolean {
  // Map old roles to new roles
  let mappedRole = role;
  if (role === "OWNER") {
    mappedRole = "ADMIN"; // OWNER maps to ADMIN
  } else if (role === "EDITOR") {
    mappedRole = "MANAGER"; // EDITOR maps to MANAGER
  } else if (role === "VIEWER") {
    mappedRole = "EMPLOYEE"; // VIEWER maps to EMPLOYEE
  }

  // New simplified role system
  switch (mappedRole) {
    case "ADMIN":
      return true; // ADMIN has all permissions
    case "MANAGER":
      // MANAGER has all permissions except AI (which is checked separately)
      return true;
    case "EMPLOYEE":
      return permission.endsWith(":view"); // EMPLOYEE is view-only
    default:
      // Backward compatibility: if role is still old format, use old logic
      if (role === "OWNER") {
        return true;
      }
      if (role === "ADMIN") {
        return !permission.startsWith("financial:turnover");
      }
      if (role === "EDITOR") {
        return (
          permission.startsWith("recipes:") ||
          permission.startsWith("ingredients:") ||
          permission.startsWith("production:view") ||
          permission.startsWith("training:view")
        );
      }
      if (role === "VIEWER") {
        return permission.endsWith(":view");
      }
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

    // ADMIN and OWNER (backward compatibility) have all permissions
    if (membership.role === "ADMIN" || membership.role === "OWNER") {
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
 * Maps old roles to new simplified roles
 */
function getLegacyPermissions(role: string): Permission[] {
  const allPermissions = getAllPermissions();
  
  // Map old roles to new roles
  let mappedRole = role;
  if (role === "OWNER") {
    mappedRole = "ADMIN";
  } else if (role === "EDITOR") {
    mappedRole = "MANAGER";
  } else if (role === "VIEWER") {
    mappedRole = "EMPLOYEE";
  }

  // New simplified role system
  switch (mappedRole) {
    case "ADMIN":
      return allPermissions; // ADMIN has all permissions
    case "MANAGER":
      return allPermissions; // MANAGER has all permissions (AI access checked separately)
    case "EMPLOYEE":
      return allPermissions.filter((p) => p.endsWith(":view")); // EMPLOYEE is view-only
    default:
      // Backward compatibility: if role is still old format, use old logic
      if (role === "OWNER") {
        return allPermissions;
      }
      if (role === "ADMIN") {
        return allPermissions.filter(
          (p) => !p.startsWith("financial:turnover")
        );
      }
      if (role === "EDITOR") {
        return allPermissions.filter(
          (p) =>
            p.startsWith("recipes:") ||
            p.startsWith("ingredients:") ||
            p === "production:view" ||
            p === "training:view"
        );
      }
      if (role === "VIEWER") {
        return allPermissions.filter((p) => p.endsWith(":view"));
      }
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

/**
 * Check if user can use AI Assistant
 * Requires: ADMIN role AND company must have AI subscription
 */
export async function canUseAIAssistant(
  userId: number,
  companyId: number
): Promise<boolean> {
  try {
    // Check role first (must be ADMIN)
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      return false;
    }

    // Only ADMIN role can use AI (OWNER is backward compatible)
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return false;
    }

    // Check if company has AI subscription
    return await canUseAI(userId, companyId);
  } catch (error) {
    console.error("[canUseAIAssistant] Error checking AI access:", error);
    return false;
  }
}

