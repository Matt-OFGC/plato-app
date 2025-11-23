/**
 * User App Subscription utilities
 * Handles checking and managing which apps a user has access to
 */

import { prisma } from "@/lib/prisma";
import type { App } from "@/lib/apps/types";

/**
 * Check if a user has an active subscription to a specific app
 */
export async function hasAppAccess(userId: number, app: App): Promise<boolean> {
  try {
    const subscription = await prisma.userAppSubscription.findUnique({
      where: {
        userId_app: {
          userId,
          app,
        },
      },
      select: {
        status: true,
        currentPeriodEnd: true,
      },
    });

    if (!subscription) {
      return false;
    }

    // Check if subscription is active
    if (subscription.status !== "active") {
      return false;
    }

    // Check if subscription hasn't expired
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[hasAppAccess] Error checking app access for user ${userId}, app ${app}:`, error);
    return false;
  }
}

/**
 * Get all apps a user has access to
 */
export async function getUserApps(userId: number): Promise<App[]> {
  try {
    const subscriptions = await prisma.userAppSubscription.findMany({
      where: {
        userId,
        status: "active",
        OR: [
          { currentPeriodEnd: null },
          { currentPeriodEnd: { gte: new Date() } },
        ],
      },
      select: {
        app: true,
      },
    });

    return subscriptions.map((sub) => sub.app);
  } catch (error) {
    console.error(`[getUserApps] Error getting user apps for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get user's app subscription details
 */
export async function getUserAppSubscription(userId: number, app: App) {
  try {
    return await prisma.userAppSubscription.findUnique({
      where: {
        userId_app: {
          userId,
          app,
        },
      },
    });
  } catch (error) {
    console.error(`[getUserAppSubscription] Error getting subscription for user ${userId}, app ${app}:`, error);
    return null;
  }
}

/**
 * Create or update a user app subscription
 */
export async function upsertUserAppSubscription(
  userId: number,
  app: App,
  data: {
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    status?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }
) {
  try {
    return await prisma.userAppSubscription.upsert({
      where: {
        userId_app: {
          userId,
          app,
        },
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        userId,
        app,
        ...data,
      },
    });
  } catch (error) {
    console.error(`[upsertUserAppSubscription] Error upserting subscription for user ${userId}, app ${app}:`, error);
    throw error;
  }
}

