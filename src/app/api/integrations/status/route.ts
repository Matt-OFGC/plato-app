import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { integrationRegistry } from "@/lib/integrations/base/integration-provider";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    // Get all integrations or specific one
    const integrations = await prisma.integrationConfig.findMany({
      where: {
        companyId,
        ...(provider ? { provider } : {}),
      },
      orderBy: {
        provider: 'asc',
      },
    });

    // Get status for each integration
    const statuses = await Promise.all(
      integrations.map(async (integration) => {
        const providerInstance = integrationRegistry.create(integration.provider, integration);
        
        if (!providerInstance) {
          return {
            id: integration.id,
            provider: integration.provider,
            connected: false,
            health: 'error' as const,
            error: 'Provider not available',
          };
        }

        const status = await providerInstance.getStatus();
        
        return {
          id: integration.id,
          provider: integration.provider,
          name: integration.name,
          ...status,
          lastSync: status.lastSync?.toISOString(),
        };
      })
    );

    return NextResponse.json({
      integrations: statuses,
      total: statuses.length,
      connected: statuses.filter(s => s.connected).length,
      healthy: statuses.filter(s => s.health === 'healthy').length,
    });
  } catch (error) {
    console.error("Integration status error:", error);
    return NextResponse.json(
      { error: "Failed to get integration status" },
      { status: 500 }
    );
  }
}
