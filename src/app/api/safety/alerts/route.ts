import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Get smart alerts for company
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const alertType = searchParams.get("type");
    const includeDismissed = searchParams.get("includeDismissed") === "true";

    let query = `
      SELECT * FROM "SmartAlert"
      WHERE "companyId" = $1
    `;

    const params: any[] = [companyId];

    if (!includeDismissed) {
      query += ` AND "isDismissed" = false`;
    }

    if (severity) {
      query += ` AND severity = $${params.length + 1}`;
      params.push(severity);
    }

    if (alertType) {
      query += ` AND "alertType" = $${params.length + 1}`;
      params.push(alertType);
    }

    query += ` ORDER BY "createdAt" DESC LIMIT 50`;

    const alerts = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json(alerts);
  } catch (error) {
    logger.error("Get alerts error", error, "Safety/Alerts");
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// Create a new alert (usually done by system/background job)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    const {
      alertType,
      severity,
      title,
      message,
      actionRequired,
      relatedEntityType,
      relatedEntityId,
    } = body;

    if (!alertType || !severity || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alert = await prisma.$queryRaw<any[]>`
      INSERT INTO "SmartAlert" (
        "companyId", "alertType", severity, title, message,
        "actionRequired", "relatedEntityType", "relatedEntityId",
        "createdAt"
      )
      VALUES (
        ${companyId}, ${alertType}, ${severity}, ${title}, ${message},
        ${actionRequired || null}, ${relatedEntityType || null}, 
        ${relatedEntityId || null}, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    return NextResponse.json(alert[0]);
  } catch (error) {
    logger.error("Create alert error", error, "Safety/Alerts");
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

