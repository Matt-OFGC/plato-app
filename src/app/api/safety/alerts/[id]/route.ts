import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Mark alert as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    const { isRead, isDismissed } = body;

    // Verify alert belongs to company
    const alert = await prisma.$queryRaw<any[]>`
      SELECT id FROM "SmartAlert"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (alert.length === 0) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Update alert
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (isRead !== undefined) {
      updates.push(`"isRead" = $${paramIndex}`);
      params.push(isRead);
      paramIndex++;
    }

    if (isDismissed !== undefined) {
      updates.push(`"isDismissed" = $${paramIndex}`);
      params.push(isDismissed);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "SmartAlert" SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      ...params,
      parseInt(id)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update alert error:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

