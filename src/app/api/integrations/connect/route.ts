import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { integrationRegistry } from "@/lib/integrations/base/integration-provider";
import { encryptCredentials, getEncryptionKey } from "@/lib/integrations/base/encryption";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const body = await request.json();
    const { provider, name, authType, credentials, settings } = body;

    if (!provider || !credentials) {
      return NextResponse.json(
        { error: "Provider and credentials are required" },
        { status: 400 }
      );
    }

    // Validate that provider exists
    const registryProviders = integrationRegistry.getRegisteredProviders();
    if (!registryProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Provider ${provider} is not available` },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const encryptionKey = getEncryptionKey();
    const encryptedCredentials = encryptCredentials(credentials, encryptionKey);

    // Create or update integration config
    const integration = await prisma.integrationConfig.upsert({
      where: {
        companyId_provider: {
          companyId,
          provider,
        },
      },
      create: {
        companyId,
        provider,
        name: name || provider,
        authType: authType || 'oauth',
        credentials: encryptedCredentials as any,
        settings: settings || {},
        isActive: true,
        isConnected: false, // Will be set to true after testing
      },
      update: {
        name: name || provider,
        credentials: encryptedCredentials as any,
        settings: settings || {},
        isActive: true,
      },
    });

    // Test the connection
    const providerInstance = integrationRegistry.create(provider, integration);
    if (!providerInstance) {
      return NextResponse.json(
        { error: "Failed to create provider instance" },
        { status: 500 }
      );
    }

    const connectionResult = await providerInstance.connect(credentials);
    
    if (connectionResult.success) {
      // Update connection status
      await prisma.integrationConfig.update({
        where: { id: integration.id },
        data: {
          isConnected: true,
          lastSyncAt: new Date(),
        },
      });
    } else {
      // Store error
      await prisma.integrationConfig.update({
        where: { id: integration.id },
        data: {
          isConnected: false,
          lastError: connectionResult.error || 'Connection failed',
          lastErrorAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: connectionResult.error || "Failed to connect" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      integration: {
        id: integration.id,
        provider,
        name,
        isConnected: true,
      },
      data: connectionResult.data,
    });
  } catch (error) {
    logger.error("Integration connection error", error, "Integrations/Connect");
    return NextResponse.json(
      { error: "Failed to connect integration" },
      { status: 500 }
    );
  }
}
