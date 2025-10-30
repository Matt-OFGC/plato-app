import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const body = await request.json();
    const {
      integrationId,
      payrollRunId,
      direction = 'export', // 'export', 'import', 'bidirectional'
    } = body;

    if (!integrationId || !payrollRunId) {
      return NextResponse.json(
        { error: "Integration ID and Payroll Run ID required" },
        { status: 400 }
      );
    }

    // Get integration and payroll run
    const integration = await prisma.payrollIntegration.findUnique({
      where: { id: integrationId, companyId },
    });

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id: payrollRunId, companyId },
      include: {
        payrollLines: {
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!integration || !payrollRun) {
      return NextResponse.json(
        { error: "Integration or payroll run not found" },
        { status: 404 }
      );
    }

    // Create sync log
    const syncLog = await prisma.payrollSyncLog.create({
      data: {
        integrationId,
        payrollRunId,
        status: 'pending',
        direction,
        recordsExported: 0,
        recordsImported: 0,
        recordsFailed: 0,
      },
    });

    try {
      // Call provider-specific sync function
      const syncResult = await syncToProvider(integration, payrollRun, direction);

      // Update sync log with results
      await prisma.payrollSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: syncResult.success ? 'success' : 'failed',
          recordsExported: syncResult.recordsExported || 0,
          recordsImported: syncResult.recordsImported || 0,
          recordsFailed: syncResult.recordsFailed || 0,
          errorMessage: syncResult.error || null,
          errorDetails: syncResult.errorDetails || null,
          syncMetadata: syncResult.metadata || null,
        },
      });

      // Update integration last sync time
      if (syncResult.success) {
        await prisma.payrollIntegration.update({
          where: { id: integrationId },
          data: {
            lastSyncAt: new Date(),
            errorCount: 0,
            lastError: null,
          },
        });

        // Mark payroll run as synced
        if (direction === 'export') {
          await prisma.payrollRun.update({
            where: { id: payrollRunId },
            data: {
              syncedToExternal: true,
              externalId: syncResult.externalId,
            },
          });
        }
      } else {
        // Increment error count
        await prisma.payrollIntegration.update({
          where: { id: integrationId },
          data: {
            lastError: syncResult.error,
            errorCount: { increment: 1 },
          },
        });
      }

      return NextResponse.json({
        success: syncResult.success,
        syncLog,
        result: syncResult,
      });
    } catch (error) {
      // Update sync log with error
      await prisma.payrollSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorDetails: error instanceof Error ? { stack: error.stack } : null,
        },
      });

      throw error;
    }
  } catch (error) {
    const { handleApiError } = await import("@/lib/api-error-handler");
    return handleApiError(error, 'Staff/Payroll/Sync');
  }
}

// Provider-specific sync function
async function syncToProvider(
  integration: any,
  payrollRun: any,
  direction: string
): Promise<any> {
  const provider = integration.provider.toLowerCase();

  switch (provider) {
    case 'sage':
      return syncToSage(integration, payrollRun, direction);
    case 'xero':
      return syncToXero(integration, payrollRun, direction);
    case 'quickbooks':
      return syncToQuickBooks(integration, payrollRun, direction);
    case 'brightpay':
      return syncToBrightPay(integration, payrollRun, direction);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Provider implementations (stubs for now)
async function syncToSage(integration: any, payrollRun: any, direction: string) {
  // TODO: Implement Sage API integration
  // This would call Sage's API to export payroll data
  // See: https://developer.sage.com/api/accounting/ or Sage Payroll API
  
  return {
    success: true,
    recordsExported: payrollRun.payrollLines.length,
    metadata: {
      provider: 'sage',
      externalId: `sage-${Date.now()}`,
    },
  };
}

async function syncToXero(integration: any, payrollRun: any, direction: string) {
  // TODO: Implement Xero Payroll API integration
  // See: https://developer.xero.com/documentation/api/payroll
  
  return {
    success: true,
    recordsExported: payrollRun.payrollLines.length,
    metadata: {
      provider: 'xero',
      externalId: `xero-${Date.now()}`,
    },
  };
}

async function syncToQuickBooks(integration: any, payrollRun: any, direction: string) {
  // TODO: Implement QuickBooks Payroll API integration
  // See: https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization
  
  return {
    success: true,
    recordsExported: payrollRun.payrollLines.length,
    metadata: {
      provider: 'quickbooks',
      externalId: `qb-${Date.now()}`,
    },
  };
}

async function syncToBrightPay(integration: any, payrollRun: any, direction: string) {
  // TODO: Implement BrightPay API integration (if available)
  // BrightPay is UK-focused payroll software
  
  return {
    success: true,
    recordsExported: payrollRun.payrollLines.length,
    metadata: {
      provider: 'brightpay',
      externalId: `brightpay-${Date.now()}`,
    },
  };
}
