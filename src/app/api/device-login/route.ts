import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

/**
 * This route handles the device-based authentication flow:
 * 1. Company owner logs in with email/password (regular login)
 * 2. System stores company session on the device
 * 3. Individual team members then use PIN to access on that device
 */

// Store company session for device-based access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, companyName } = body;

    if (!companyId) {
      return NextResponse.json({ error: "Missing company ID" }, { status: 400 });
    }

    // Set a device-level company session cookie (30 days)
    const cookieStore = await cookies();
    cookieStore.set({
      name: "device_company",
      value: JSON.stringify({ companyId, companyName }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({ 
      success: true,
      message: "Device configured for company access",
    });
  } catch (error) {
    logger.error("Device login error", error, "DeviceLogin");
    return NextResponse.json(
      { error: "Failed to configure device" },
      { status: 500 }
    );
  }
}

// Get current device company session
export async function GET() {
  try {
    const cookieStore = await cookies();
    const deviceCompany = cookieStore.get("device_company");

    if (!deviceCompany) {
      return NextResponse.json({ deviceCompany: null });
    }

    const data = JSON.parse(deviceCompany.value);
    return NextResponse.json({ deviceCompany: data });
  } catch (error) {
    logger.error("Get device session error", error, "DeviceLogin");
    return NextResponse.json({ deviceCompany: null });
  }
}

// Clear device company session
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("device_company");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Clear device session error", error, "DeviceLogin");
    return NextResponse.json(
      { error: "Failed to clear device session" },
      { status: 500 }
    );
  }
}

