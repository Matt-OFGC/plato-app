import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const integrations = await prisma.payrollIntegration.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Get integrations error:", error);
    return NextResponse.json(
      { error: "Failed to get integrations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const body = await request.json();
    const {
      provider,
      name,
      apiKey,
      apiSecret,
      accessToken,
      config,
      isActive,
      autoSync,
    } = body;

    if (!provider || !name) {
      return NextResponse.json(
        { error: "Provider and name required" },
        { status: 400 }
      );
    }

    // TODO: Encrypt sensitive data before storing
    const integration = await prisma.payrollIntegration.create({
      data: {
        companyId,
        provider,
        name,
        apiKey: apiKey || null,
        apiSecret: apiSecret || null,
        accessToken: accessToken || null,
        config: config || null,
        isActive: isActive !== false,
        autoSync: autoSync === true,
      },
    });

    return NextResponse.json({ integration }, { status: 201 });
  } catch (error) {
    console.error("Create integration error:", error);
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Integration ID required" },
        { status: 400 }
      );
    }

    // TODO: Encrypt sensitive data before updating
    const integration = await prisma.payrollIntegration.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ integration });
  } catch (error) {
    console.error("Update integration error:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return NextResponse.json(
        { error: "Integration ID required" },
        { status: 400 }
      );
    }

    await prisma.payrollIntegration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete integration error:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
