/**
 * Mentor subscription management
 * Handles checking and managing Mentor AI Assistant subscriptions
 */

import { prisma } from "../prisma";

/**
 * Check if a company has an active Mentor subscription
 */
export async function hasMentorAccess(companyId: number): Promise<boolean> {
  try {
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        companyId,
        status: "active",
        OR: [
          { currentPeriodEnd: null },
          { currentPeriodEnd: { gt: new Date() } },
        ],
      },
    });

    return subscription !== null;
  } catch (error) {
    console.error(`[hasMentorAccess] Error checking access for company ${companyId}:`, error);
    return false;
  }
}

/**
 * Get Mentor subscription for a company
 */
export async function getMentorSubscription(companyId: number) {
  try {
    return await prisma.mentorSubscription.findFirst({
      where: {
        companyId,
        status: "active",
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(`[getMentorSubscription] Error getting subscription for company ${companyId}:`, error);
    return null;
  }
}

/**
 * Create or update Mentor subscription
 */
export async function upsertMentorSubscription(
  userId: number,
  companyId: number,
  data: {
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    status?: string;
    subscriptionType?: "unlimited" | "capped";
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }
) {
  try {
    return await prisma.mentorSubscription.upsert({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      create: {
        userId,
        companyId,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
        stripePriceId: data.stripePriceId || null,
        status: data.status || "active",
        subscriptionType: data.subscriptionType || "unlimited",
        currentPeriodStart: data.currentPeriodStart || null,
        currentPeriodEnd: data.currentPeriodEnd || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      },
      update: {
        ...(data.stripeSubscriptionId && { stripeSubscriptionId: data.stripeSubscriptionId }),
        ...(data.stripePriceId && { stripePriceId: data.stripePriceId }),
        ...(data.status && { status: data.status }),
        ...(data.subscriptionType && { subscriptionType: data.subscriptionType }),
        ...(data.currentPeriodStart && { currentPeriodStart: data.currentPeriodStart }),
        ...(data.currentPeriodEnd && { currentPeriodEnd: data.currentPeriodEnd }),
        ...(data.cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd: data.cancelAtPeriodEnd }),
      },
    });
  } catch (error) {
    console.error(`[upsertMentorSubscription] Error upserting subscription:`, error);
    throw error;
  }
}

