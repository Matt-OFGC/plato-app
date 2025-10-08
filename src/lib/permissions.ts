import { MemberRole } from "@/generated/prisma";
import { prisma } from "./prisma";

export type Permission = 
  | "read:ingredients"
  | "create:ingredients"
  | "edit:ingredients"
  | "delete:ingredients"
  | "read:recipes"
  | "create:recipes"
  | "edit:recipes"
  | "delete:recipes"
  | "manage:team"
  | "manage:billing"
  | "manage:company";

const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  OWNER: [
    "read:ingredients",
    "create:ingredients",
    "edit:ingredients",
    "delete:ingredients",
    "read:recipes",
    "create:recipes",
    "edit:recipes",
    "delete:recipes",
    "manage:team",
    "manage:billing",
    "manage:company",
  ],
  ADMIN: [
    "read:ingredients",
    "create:ingredients",
    "edit:ingredients",
    "delete:ingredients",
    "read:recipes",
    "create:recipes",
    "edit:recipes",
    "delete:recipes",
    "manage:team",
  ],
  EDITOR: [
    "read:ingredients",
    "create:ingredients",
    "edit:ingredients",
    "read:recipes",
    "create:recipes",
    "edit:recipes",
  ],
  VIEWER: [
    "read:ingredients",
    "read:recipes",
  ],
};

export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function getUserRole(userId: number, companyId: number): Promise<MemberRole | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  return membership?.isActive ? membership.role : null;
}

export async function checkPermission(
  userId: number,
  companyId: number,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId, companyId);
  if (!role) return false;
  return hasPermission(role, permission);
}

export function getRoleDisplayName(role: MemberRole): string {
  const names: Record<MemberRole, string> = {
    OWNER: "Owner",
    ADMIN: "Administrator",
    EDITOR: "Editor",
    VIEWER: "Viewer",
  };
  return names[role];
}

export function getRoleDescription(role: MemberRole): string {
  const descriptions: Record<MemberRole, string> = {
    OWNER: "Full access to everything including billing and team management",
    ADMIN: "Full access to content and can manage team members",
    EDITOR: "Can create and edit all recipes and ingredients",
    VIEWER: "Can view all content but cannot make changes",
  };
  return descriptions[role];
}

