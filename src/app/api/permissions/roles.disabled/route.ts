import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { canManageTeam } from "@/lib/permissions";
import {
  createRole,
  getCompanyRoles,
  updateRolePermissions,
  deleteRole,
  RoleWithPermissions,
} from "@/lib/services/permissionService";
import { Permission } from "@/lib/permissions";

// Get all roles for a company
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

    // Check permission
    const canManage = await canManageTeam(session.id, companyId);
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to manage roles" },
        { status: 403 }
      );
    }

    const roles = await getCompanyRoles(companyId);
    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// Create a new role
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const role = await createRole(
      companyId,
      name,
      description || null,
      permissions as Permission[]
    );

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error("Create role error:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}

