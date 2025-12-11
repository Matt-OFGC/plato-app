import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// Sign off on training completion
export async function POST(
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
    const canSignOff = await checkPermission(
      session.id,
      companyId,
      "training:signoff"
    );
    if (!canSignOff) {
      return NextResponse.json(
        { error: "No permission to sign off on training" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const recordId = parseInt(id);

    if (isNaN(recordId)) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }

    const body = await request.json();
    const { notes } = body;

    // Get record
    const record = await prisma.trainingRecord.findUnique({
      where: { id: recordId },
      include: {
        membership: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!record || record.membership.companyId !== companyId) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    if (record.status !== "completed") {
      return NextResponse.json(
        { error: "Training must be completed before sign-off" },
        { status: 400 }
      );
    }

    // Update record with sign-off
    const updatedRecord = await prisma.trainingRecord.update({
      where: { id: recordId },
      data: {
        signedOffBy: session.id,
        signedOffAt: new Date(),
        completionNotes: notes || record.completionNotes,
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        module: {
          select: {
            id: true,
            title: true,
          },
        },
        signedOffByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ record: updatedRecord });
  } catch (error) {
    logger.error("Sign off training error", error, "Training/Records");
    return NextResponse.json(
      { error: "Failed to sign off on training" },
      { status: 500 }
    );
  }
}

