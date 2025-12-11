import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { getTrainingRelations } from "@/lib/services/relationService";
import { logger } from "@/lib/logger";

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
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
    }

    const relations = await getTrainingRelations(moduleId);

    return NextResponse.json({ relations });
  } catch (error) {
    logger.error("Get training relations error", error, "Training/Modules");
    return NextResponse.json(
      { error: "Failed to fetch relations" },
      { status: 500 }
    );
  }
}

