import { prisma } from "@/lib/prisma";
import { Permission, getAllPermissions } from "@/lib/permissions";

export interface RoleWithPermissions {
  id: number;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: Permission[];
}

/**
 * Create a new custom role with permissions
 */
export async function createRole(
  companyId: number,
  name: string,
  description: string | null,
  permissions: Permission[]
): Promise<RoleWithPermissions> {
  const role = await prisma.role.create({
    data: {
      name,
      description,
      companyId,
      isSystemRole: false,
      permissions: {
        create: permissions.map((permission) => ({
          permission,
        })),
      },
    },
    include: {
      permissions: true,
    },
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissions: role.permissions.map((p) => p.permission as Permission),
  };
}

/**
 * Update a role's permissions
 */
export async function updateRolePermissions(
  roleId: number,
  permissions: Permission[]
): Promise<RoleWithPermissions> {
  // Delete existing permissions
  await prisma.rolePermission.deleteMany({
    where: { roleId },
  });

  // Create new permissions
  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId,
      permission,
    })),
  });

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: true,
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissions: role.permissions.map((p) => p.permission as Permission),
  };
}

/**
 * Get all roles for a company
 */
export async function getCompanyRoles(
  companyId: number
): Promise<RoleWithPermissions[]> {
  const roles = await prisma.role.findMany({
    where: { companyId },
    include: {
      permissions: true,
    },
    orderBy: {
      isSystemRole: "desc",
      name: "asc",
    },
  });

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissions: role.permissions.map((p) => p.permission as Permission),
  }));
}

/**
 * Get role by ID
 */
export async function getRole(
  roleId: number
): Promise<RoleWithPermissions | null> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: true,
    },
  });

  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissions: role.permissions.map((p) => p.permission as Permission),
  };
}

/**
 * Delete a role (only if not system role and not in use)
 */
export async function deleteRole(roleId: number): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      _count: {
        select: {
          memberships: true,
        },
      },
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystemRole) {
    throw new Error("Cannot delete system role");
  }

  if (role._count.memberships > 0) {
    throw new Error("Cannot delete role that is assigned to members");
  }

  await prisma.role.delete({
    where: { id: roleId },
  });
}

/**
 * Initialize default roles for a company
 */
export async function initializeDefaultRoles(
  companyId: number
): Promise<void> {
  const existingRoles = await prisma.role.count({
    where: { companyId },
  });

  if (existingRoles > 0) {
    return; // Already initialized
  }

  // Create default roles with standard permissions
  const defaultRoles = [
    {
      name: "Staff Member",
      description: "Basic staff member with minimal permissions",
      permissions: [
        "production:view",
        "training:view",
        "timesheets:view",
        "recipes:view",
      ] as Permission[],
    },
    {
      name: "Supervisor",
      description: "Supervisor with approval and viewing permissions",
      permissions: [
        "staff:view",
        "production:view",
        "production:assign",
        "training:view",
        "training:signoff",
        "timesheets:view",
        "timesheets:approve",
        "scheduling:view",
        "recipes:view",
        "cleaning:view",
        "cleaning:complete",
      ] as Permission[],
    },
    {
      name: "Manager",
      description: "Manager with staff and financial viewing permissions",
      permissions: [
        "staff:view",
        "staff:edit",
        "staff:assign",
        "production:view",
        "production:create",
        "production:edit",
        "production:assign",
        "training:view",
        "training:create",
        "training:edit",
        "training:assign",
        "training:signoff",
        "timesheets:view",
        "timesheets:approve",
        "scheduling:view",
        "scheduling:create",
        "scheduling:edit",
        "recipes:view",
        "recipes:create",
        "recipes:edit",
        "cleaning:view",
        "cleaning:create",
        "cleaning:assign",
        "cleaning:complete",
        "financial:wages:view",
        "financial:expenses:view",
        "financial:reports:view",
      ] as Permission[],
    },
  ];

  for (const roleData of defaultRoles) {
    await createRole(
      companyId,
      roleData.name,
      roleData.description,
      roleData.permissions
    );
  }
}

