import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { createSession } from "@/lib/auth-simple";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = true, userId, pinAuth } = body;

    // Handle PIN-based authentication (for device login)
    if (pinAuth && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Create session for PIN login (always remember for device-based login)
      await createSession({
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        isAdmin: user.isAdmin,
      }, true);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // Regular email/password authentication
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session with remember me option
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      isAdmin: user.isAdmin,
    }, rememberMe);

    // Check if user is an owner/admin to enable device mode
    const membership = await prisma.membership.findFirst({
      where: { 
        userId: user.id,
        isActive: true,
        role: { in: ["OWNER", "ADMIN"] },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      canEnableDeviceMode: !!membership,
      company: membership?.company,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

