import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Record a temperature reading (can be called by IoT devices via webhook)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { temperature, unit = "celsius", timestamp } = body;

    if (!temperature || isNaN(parseFloat(temperature))) {
      return NextResponse.json(
        { error: "Invalid temperature value" },
        { status: 400 }
      );
    }

    // Get sensor info
    const sensor = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemperatureSensor"
      WHERE id = ${parseInt(id)} AND "isActive" = true
    `;

    if (sensor.length === 0) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
    }

    const sensorData = sensor[0];
    const tempValue = parseFloat(temperature);
    const companyId = sensorData.companyId;

    // Check if out of range
    let isOutOfRange = false;
    if (sensorData.minThreshold && tempValue < sensorData.minThreshold) {
      isOutOfRange = true;
    }
    if (sensorData.maxThreshold && tempValue > sensorData.maxThreshold) {
      isOutOfRange = true;
    }

    // Create reading
    const reading = await prisma.$queryRaw<any[]>`
      INSERT INTO "TemperatureReading" (
        "sensorId", "companyId", "temperatureValue", "temperatureUnit",
        "isOutOfRange", "recordedAt"
      )
      VALUES (
        ${parseInt(id)}, ${companyId}, ${tempValue}, ${unit},
        ${isOutOfRange}, ${timestamp ? new Date(timestamp) : new Date()}
      )
      RETURNING *
    `;

    // Update sensor's last reading time
    await prisma.$executeRaw`
      UPDATE "TemperatureSensor"
      SET "lastReadingAt" = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
    `;

    // Create alert if out of range
    if (isOutOfRange) {
      await prisma.$queryRaw`
        INSERT INTO "SmartAlert" (
          "companyId", "alertType", severity, title, message,
          "actionRequired", "relatedEntityType", "relatedEntityId", "createdAt"
        )
        VALUES (
          ${companyId}, 'temperature', 'urgent',
          ${`Temperature Alert: ${sensorData.sensorName}`},
          ${`Temperature is ${tempValue}°${unit.toUpperCase()} (out of range)`},
          ${`Check ${sensorData.sensorName} immediately`},
          'sensor', ${parseInt(id)}, CURRENT_TIMESTAMP
        )
      `;
    }

    return NextResponse.json({
      success: true,
      reading: reading[0],
      alertCreated: isOutOfRange,
    });
  } catch (error) {
    logger.error("Record reading error", error, "Safety/Sensors");
    return NextResponse.json(
      { error: "Failed to record reading" },
      { status: 500 }
    );
  }
}

