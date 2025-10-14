import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Generate a secure random token
    const token = randomBytes(32).toString("hex");

    const customer = await prisma.wholesaleCustomer.update({
      where: { id: customerId },
      data: {
        portalToken: token,
        portalEnabled: true,
      },
    });

    return NextResponse.json({
      token,
      portalUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/wholesale/portal/${token}`,
      customer,
    });
  } catch (error) {
    console.error("Generate portal token error:", error);
    return NextResponse.json(
      { error: "Failed to generate portal token" },
      { status: 500 }
    );
  }
}

