import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { getStaffRelations } from "@/lib/services/relationService";

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
    const membershipId = parseInt(id);

    if (isNaN(membershipId)) {
      return NextResponse.json({ error: "Invalid membership ID" }, { status: 400 });
    }

    const relations = await getStaffRelations(membershipId);

    return NextResponse.json({ relations });
  } catch (error) {
    console.error("Get staff relations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch relations" },
      { status: 500 }
    );
  }
}

