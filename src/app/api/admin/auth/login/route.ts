import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Verify admin credentials
    const isValid = await verifyAdminCredentials(username, password);

    if (!isValid) {
      // Log failed attempt (in production, implement rate limiting)
      console.warn("Failed admin login attempt:", { username, timestamp: new Date() });
      
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create admin session
    await createAdminSession(username);

    console.log("Successful admin login:", { username, timestamp: new Date() });

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

