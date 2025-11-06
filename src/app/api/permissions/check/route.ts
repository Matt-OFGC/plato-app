import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { checkPermission, getUserPermissions, Permission } from "@/lib/permissions";

// Check if user has a specific permission
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

    const body = await request.json();
    const { permission } = body;

    if (!permission) {
      return NextResponse.json(
        { error: "Permission required" },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission(
      session.id,
      companyId,
      permission as Permission
    );

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error("Check permission error:", error);
    return NextResponse.json(
      { error: "Failed to check permission" },
      { status: 500 }
    );
  }
}

// Get all permissions for current user
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

    const permissions = await getUserPermissions(session.id, companyId);

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Get permissions error:", error);
    return NextResponse.json(
      { error: "Failed to get permissions" },
      { status: 500 }
    );
  }
}

