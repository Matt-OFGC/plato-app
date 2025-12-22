import { prisma } from "@/lib/prisma";

export type Permission =
  | "recipes:view"
  | "recipes:create"
  | "recipes:edit"
  | "recipes:delete"
  | "ingredients:view"
  | "ingredients:create"
  | "ingredients:edit"
  | "ingredients:delete"
  | "production:view"
  | "production:create"
  | "production:edit"
  | "wholesale:view"
  | "wholesale:create"
  | "wholesale:edit"
  | "team:manage"
  | "settings:view"
  | "settings:edit";

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
    });

    if (!membership || !membership.isActive) {
      return false;
    }

    // ADMIN has all permissions
    if (membership.role === "ADMIN") {
      return true;
    }

    // MANAGER has all permissions except settings:edit (company settings)
    if (membership.role === "MANAGER") {
      return permission !== "settings:edit";
    }

    // STAFF: View-only by default, but can have granular permissions
    if (membership.role === "STAFF") {
      // Check if it's a view permission
      if (permission.endsWith(":view")) {
        return true;
      }

      // Check staff granular permissions
      if (membership.staffPermissions) {
        const perms = membership.staffPermissions as {
          canEditIngredients?: boolean;
          canEditRecipes?: boolean;
        };

        // Check if staff can edit ingredients
        if (
          permission.startsWith("ingredients:") &&
          (permission === "ingredients:edit" || permission === "ingredients:create" || permission === "ingredients:delete")
        ) {
          return perms.canEditIngredients === true;
        }

        // Check if staff can edit recipes
        if (
          permission.startsWith("recipes:") &&
          (permission === "recipes:edit" || permission === "recipes:create" || permission === "recipes:delete")
        ) {
          return perms.canEditRecipes === true;
        }
      }

      // Staff cannot do anything else
      return false;
    }

    return false;
  } catch (error) {
    console.error("Permission check error:", error);
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
    });

    if (!membership || !membership.isActive) {
      return [];
    }

    // ADMIN has all permissions
    if (membership.role === "ADMIN") {
      return getAllPermissions();
    }

    // MANAGER has all except settings:edit
    if (membership.role === "MANAGER") {
      return getAllPermissions().filter((p) => p !== "settings:edit");
    }

    // STAFF: View-only + granular permissions
    if (membership.role === "STAFF") {
      const viewPermissions = getAllPermissions().filter((p) => p.endsWith(":view"));
      
      if (membership.staffPermissions) {
        const perms = membership.staffPermissions as {
          canEditIngredients?: boolean;
          canEditRecipes?: boolean;
        };

        const additionalPerms: Permission[] = [];

        if (perms.canEditIngredients) {
          additionalPerms.push("ingredients:create", "ingredients:edit", "ingredients:delete");
        }

        if (perms.canEditRecipes) {
          additionalPerms.push("recipes:create", "recipes:edit", "recipes:delete");
        }

        return [...viewPermissions, ...additionalPerms];
      }

      return viewPermissions;
    }

    return [];
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
    "recipes:view",
    "recipes:create",
    "recipes:edit",
    "recipes:delete",
    "ingredients:view",
    "ingredients:create",
    "ingredients:edit",
    "ingredients:delete",
    "production:view",
    "production:create",
    "production:edit",
    "wholesale:view",
    "wholesale:create",
    "wholesale:edit",
    "team:manage",
    "settings:view",
    "settings:edit",
  ];
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
