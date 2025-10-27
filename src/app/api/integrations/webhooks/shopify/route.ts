import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { processWebhook, updateWebhookLog } from "@/lib/integrations/base/webhook-handler";
import { integrationRegistry } from "@/lib/integrations/base/integration-provider";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    // Process the webhook
    const result = await processWebhook(request, 'shopify', companyId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Handle the webhook event
    if (result.event && result.logId) {
      try {
        // Get the integration
        const integration = await prisma.integrationConfig.findUnique({
          where: {
            companyId_provider: {
              companyId,
              provider: 'shopify',
            },
          },
        });

        if (integration) {
          const providerInstance = integrationRegistry.create('shopify', integration);
          
          if (providerInstance) {
            const handleResult = await providerInstance.handleWebhook(result.event);
            
            // Update webhook log
            await updateWebhookLog(
              result.logId,
              handleResult.success ? 'success' : 'error',
              200,
              handleResult.data,
              handleResult.error
            );

            return NextResponse.json({
              success: true,
              processed: handleResult.success,
              data: handleResult.data,
            });
          }
        }

        // If no provider instance, just mark as processed
        await updateWebhookLog(result.logId, 'success', 200);
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("Webhook handling error:", error);
        
        if (result.logId) {
          await updateWebhookLog(
            result.logId,
            'error',
            500,
            undefined,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }

        return NextResponse.json(
          { error: "Failed to handle webhook" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
