import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Get all temperature sensors
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

    const sensors = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemperatureSensor"
      WHERE "companyId" = ${companyId}
      ORDER BY "sensorName" ASC
    `;

    // Get latest reading for each sensor
    const sensorsWithReadings = await Promise.all(
      sensors.map(async (sensor) => {
        const latestReading = await prisma.$queryRaw<any[]>`
          SELECT * FROM "TemperatureReading"
          WHERE "sensorId" = ${sensor.id}
          ORDER BY "recordedAt" DESC
          LIMIT 1
        `;

        return {
          ...sensor,
          latestReading: latestReading[0] || null,
        };
      })
    );

    return NextResponse.json(sensorsWithReadings);
  } catch (error) {
    logger.error("Get sensors error", error, "Safety/Sensors");
    return NextResponse.json(
      { error: "Failed to fetch sensors" },
      { status: 500 }
    );
  }
}

// Create a new sensor
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    const {
      sensorName,
      sensorType,
      location,
      targetTemperature,
      minThreshold,
      maxThreshold,
    } = body;

    if (!sensorName) {
      return NextResponse.json(
        { error: "Sensor name is required" },
        { status: 400 }
      );
    }

    const sensor = await prisma.$queryRaw<any[]>`
      INSERT INTO "TemperatureSensor" (
        "companyId", "sensorName", "sensorType", location,
        "targetTemperature", "minThreshold", "maxThreshold",
        "isActive", "createdAt"
      )
      VALUES (
        ${companyId}, ${sensorName}, ${sensorType || null}, ${location || null},
        ${targetTemperature || null}, ${minThreshold || null}, ${maxThreshold || null},
        true, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    return NextResponse.json(sensor[0]);
  } catch (error) {
    logger.error("Create sensor error", error, "Safety/Sensors");
    return NextResponse.json(
      { error: "Failed to create sensor" },
      { status: 500 }
    );
  }
}

