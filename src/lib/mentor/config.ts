/**
 * Mentor configuration management
 * Handles per-company Mentor settings and preferences
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Get or create Mentor config for a company
 */
export async function getMentorConfig(companyId: number) {
  try {
    let config = await prisma.mentorConfig.findUnique({
      where: { companyId },
    });

    if (!config) {
      // Create default config
      config = await prisma.mentorConfig.create({
        data: {
          companyId,
          enabled: true,
          dataSources: {
            recipes: true,
            ingredients: true,
            sales: true,
            staff: false,
            suppliers: true,
            production: false,
            analytics: true,
          },
          piiMaskingEnabled: true,
          conversationRetention: 90,
          enableInternetSearch: true,
          enableProactiveAlerts: true,
        },
      });
    }

    return config;
  } catch (error) {
    logger.error(`Error getting config for company ${companyId}`, error, "Mentor/Config");
    throw error;
  }
}

/**
 * Update Mentor config
 */
export async function updateMentorConfig(
  companyId: number,
  data: {
    enabled?: boolean;
    dataSources?: Record<string, boolean>;
    piiMaskingEnabled?: boolean;
    piiMaskingRules?: Record<string, any>;
    conversationRetention?: number;
    enableInternetSearch?: boolean;
    enableProactiveAlerts?: boolean;
    preferences?: Record<string, any>;
  }
) {
  try {
    return await prisma.mentorConfig.upsert({
      where: { companyId },
      create: {
        companyId,
        ...data,
      },
      update: data,
    });
  } catch (error) {
    logger.error(`Error updating config for company ${companyId}`, error, "Mentor/Config");
    throw error;
  }
}

