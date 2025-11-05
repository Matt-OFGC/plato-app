import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Get sensor details with readings
export async function GET(
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

    const sensor = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemperatureSensor"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (sensor.length === 0) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
    }

    // Get recent readings (last 24 hours)
    const readings = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemperatureReading"
      WHERE "sensorId" = ${parseInt(id)}
      AND "recordedAt" >= NOW() - INTERVAL '24 hours'
      ORDER BY "recordedAt" ASC
    `;

    return NextResponse.json({
      ...sensor[0],
      readings,
    });
  } catch (error) {
    console.error("Get sensor error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sensor" },
      { status: 500 }
    );
  }
}

// Update sensor
export async function PUT(
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

    const {
      sensorName,
      sensorType,
      location,
      targetTemperature,
      minThreshold,
      maxThreshold,
      isActive,
    } = body;

    // Verify sensor belongs to company
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM "TemperatureSensor"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
    }

    await prisma.$executeRaw`
      UPDATE "TemperatureSensor"
      SET
        "sensorName" = ${sensorName},
        "sensorType" = ${sensorType || null},
        location = ${location || null},
        "targetTemperature" = ${targetTemperature || null},
        "minThreshold" = ${minThreshold || null},
        "maxThreshold" = ${maxThreshold || null},
        "isActive" = ${isActive !== undefined ? isActive : true}
      WHERE id = ${parseInt(id)}
    `;

    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemperatureSensor" WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Update sensor error:", error);
    return NextResponse.json(
      { error: "Failed to update sensor" },
      { status: 500 }
    );
  }
}

// Delete sensor
export async function DELETE(
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

    await prisma.$executeRaw`
      DELETE FROM "TemperatureSensor"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete sensor error:", error);
    return NextResponse.json(
      { error: "Failed to delete sensor" },
      { status: 500 }
    );
  }
}

