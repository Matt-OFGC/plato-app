import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { getEntityRelations, EntityType } from "@/lib/services/relationService";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
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

    const { entityType, entityId } = await params;
    const id = parseInt(entityId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid entity ID" }, { status: 400 });
    }

    const validTypes: EntityType[] = [
      "staff",
      "training",
      "recipe",
      "production",
      "cleaning",
    ];

    if (!validTypes.includes(entityType as EntityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }

    const relations = await getEntityRelations(entityType as EntityType, id);

    return NextResponse.json({ relations });
  } catch (error) {
    logger.error("Get entity relations error", error, "Relations");
    return NextResponse.json(
      { error: "Failed to fetch relations" },
      { status: 500 }
    );
  }
}

