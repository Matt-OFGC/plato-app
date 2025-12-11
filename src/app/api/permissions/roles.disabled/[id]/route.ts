import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { canManageTeam } from "@/lib/permissions";
import {
  getRole,
  updateRolePermissions,
  deleteRole,
} from "@/lib/services/permissionService";
import { Permission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// Get role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    const role = await getRole(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Verify role belongs to company
    const { prisma } = await import("@/lib/prisma");
    const roleCheck = await prisma.role.findUnique({
      where: { id: roleId },
      select: { companyId: true },
    });

    if (!roleCheck || roleCheck.companyId !== companyId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    logger.error("Get role error", error, "Permissions/Roles");
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

// Update role permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check permission
    const canManage = await canManageTeam(session.id, companyId);
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to manage roles" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 }
      );
    }

    // Verify role belongs to company
    const { prisma } = await import("@/lib/prisma");
    const roleCheck = await prisma.role.findUnique({
      where: { id: roleId },
      select: { companyId: true, isSystemRole: true },
    });

    if (!roleCheck || roleCheck.companyId !== companyId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (roleCheck.isSystemRole) {
      return NextResponse.json(
        { error: "Cannot modify system role" },
        { status: 400 }
      );
    }

    // Update role if name/description provided
    if (name || description !== undefined) {
      await prisma.role.update({
        where: { id: roleId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });
    }

    // Update permissions
    const role = await updateRolePermissions(
      roleId,
      permissions as Permission[]
    );

    return NextResponse.json({ role });
  } catch (error) {
    logger.error("Update role error", error, "Permissions/Roles");
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check permission
    const canManage = await canManageTeam(session.id, companyId);
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to manage roles" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    // Verify role belongs to company
    const { prisma } = await import("@/lib/prisma");
    const roleCheck = await prisma.role.findUnique({
      where: { id: roleId },
      select: { companyId: true },
    });

    if (!roleCheck || roleCheck.companyId !== companyId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    await deleteRole(roleId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Delete role error", error, "Permissions/Roles");
    return NextResponse.json(
      { error: error.message || "Failed to delete role" },
      { status: 500 }
    );
  }
}

