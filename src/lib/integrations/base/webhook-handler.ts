import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { WebhookEvent } from "./integration-provider";

/**
 * Process incoming webhook request
 */
export async function processWebhook(
  request: NextRequest,
  provider: string,
  companyId: number
): Promise<{
  success: boolean;
  event?: WebhookEvent;
  logId?: number;
  error?: string;
}> {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());

    // Create webhook log entry
    const log = await prisma.webhookLog.create({
      data: {
        integrationConfig: {
          connect: {
            companyId_provider: {
              companyId,
              provider,
            },
          },
        },
        eventType: body.eventType || 'unknown',
        payload: body as any,
        headers: headers as any,
        status: 'pending',
      },
    });

    // Parse event
    const event: WebhookEvent = {
      provider,
      eventType: body.eventType || 'unknown',
      data: body.data || body,
      timestamp: new Date(body.timestamp || Date.now()),
    };

    return {
      success: true,
      event,
      logId: log.id,
    };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process webhook",
    };
  }
}

/**
 * Update webhook log with result
 */
export async function updateWebhookLog(
  logId: number,
  status: 'success' | 'error',
  statusCode: number,
  responseData?: any,
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.webhookLog.update({
      where: { id: logId },
      data: {
        status,
        statusCode,
        responseData: responseData ? (responseData as any) : null,
        processedAt: new Date(),
        errorMessage: errorMessage || null,
      },
    });
  } catch (error) {
    console.error("Failed to update webhook log:", error);
  }
}

/**
 * Verify webhook signature (provider-specific)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  provider: string
): boolean {
  switch (provider) {
    case 'shopify':
      return verifyShopifySignature(payload, signature, secret);
    case 'stripe':
      return verifyStripeSignature(payload, signature, secret);
    default:
      // For providers without signature verification, accept all
      return true;
  }
}

/**
 * Verify Shopify webhook signature
 */
function verifyShopifySignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const hash = hmac.digest('base64');
  return hash === signature;
}

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  // Stripe signature format: t=<timestamp>,v1=<signature>
  const elements = signature.split(',');
  const signatureElement = elements.find((el: string) => el.startsWith('v1='));
  if (!signatureElement) return false;

  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const hash = hmac.digest('hex');
  const expectedSignature = signatureElement.replace('v1=', '');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedSignature));
}
