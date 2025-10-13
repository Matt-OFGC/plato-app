/**
 * Audit Logging System
 * Logs all security-sensitive operations for compliance and security monitoring
 */

import { prisma } from "@/lib/prisma";

export type AuditAction =
  // Authentication events
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_REGISTER"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  
  // Authorization events
  | "ROLE_CHANGED"
  | "PERMISSION_GRANTED"
  | "PERMISSION_DENIED"
  | "UNAUTHORIZED_ACCESS_ATTEMPT"
  
  // Data events
  | "RECIPE_CREATED"
  | "RECIPE_UPDATED"
  | "RECIPE_DELETED"
  | "INGREDIENT_CREATED"
  | "INGREDIENT_UPDATED"
  | "INGREDIENT_DELETED"
  
  // Team events
  | "MEMBER_INVITED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MEMBER_ROLE_CHANGED"
  
  // Admin events
  | "ADMIN_LOGIN"
  | "ADMIN_ACTION"
  | "SYSTEM_CONFIG_CHANGED"
  
  // File events
  | "FILE_UPLOADED"
  | "FILE_DELETED";

export type AuditLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface AuditLogEntry {
  action: AuditAction;
  userId?: number;
  companyId?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  level?: AuditLevel;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  action,
  userId,
  companyId,
  ipAddress,
  userAgent,
  metadata = {},
  level = "INFO",
}: AuditLogEntry): Promise<void> {
  try {
    // Store in database (you'll need to create this table)
    await prisma.$executeRaw`
      INSERT INTO audit_logs (action, user_id, company_id, ip_address, user_agent, metadata, level, created_at)
      VALUES (${action}, ${userId}, ${companyId}, ${ipAddress}, ${userAgent}, ${JSON.stringify(metadata)}, ${level}, NOW())
      ON CONFLICT DO NOTHING
    `.catch(() => {
      // If table doesn't exist, just log to console for now
      console.log('[AUDIT]', {
        timestamp: new Date().toISOString(),
        action,
        userId,
        companyId,
        ipAddress,
        metadata,
        level,
      });
    });
  } catch (error) {
    // Never let audit logging break the main application
    console.error('Audit log error:', error);
  }
}

/**
 * Helper to extract request info for audit logs
 */
export function getRequestInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const headers = request.headers;
  
  // Get IP from various headers
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || "unknown";
  
  const userAgent = headers.get("user-agent") || "unknown";
  
  return { ipAddress, userAgent };
}

/**
 * Convenience functions for common audit log scenarios
 */
export const auditLog = {
  // Authentication
  async loginSuccess(userId: number, request: Request) {
    const { ipAddress, userAgent } = getRequestInfo(request);
    await createAuditLog({
      action: "USER_LOGIN",
      userId,
      ipAddress,
      userAgent,
      level: "INFO",
    });
  },

  async loginFailed(email: string, request: Request, reason: string) {
    const { ipAddress, userAgent } = getRequestInfo(request);
    await createAuditLog({
      action: "LOGIN_FAILED",
      ipAddress,
      userAgent,
      metadata: { email, reason },
      level: "WARNING",
    });
  },

  async register(userId: number, companyId: number, request: Request) {
    const { ipAddress, userAgent } = getRequestInfo(request);
    await createAuditLog({
      action: "USER_REGISTER",
      userId,
      companyId,
      ipAddress,
      userAgent,
      level: "INFO",
    });
  },

  // Authorization
  async unauthorizedAccess(userId: number | undefined, resource: string, request: Request) {
    const { ipAddress, userAgent } = getRequestInfo(request);
    await createAuditLog({
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      userId,
      ipAddress,
      userAgent,
      metadata: { resource },
      level: "WARNING",
    });
  },

  async roleChanged(
    adminUserId: number,
    targetUserId: number,
    oldRole: string,
    newRole: string,
    companyId: number
  ) {
    await createAuditLog({
      action: "ROLE_CHANGED",
      userId: adminUserId,
      companyId,
      metadata: { targetUserId, oldRole, newRole },
      level: "INFO",
    });
  },

  // Data operations
  async recipeDeleted(userId: number, recipeId: number, recipeName: string, companyId: number) {
    await createAuditLog({
      action: "RECIPE_DELETED",
      userId,
      companyId,
      metadata: { recipeId, recipeName },
      level: "INFO",
    });
  },

  async ingredientDeleted(
    userId: number,
    ingredientId: number,
    ingredientName: string,
    companyId: number
  ) {
    await createAuditLog({
      action: "INGREDIENT_DELETED",
      userId,
      companyId,
      metadata: { ingredientId, ingredientName },
      level: "INFO",
    });
  },

  // Team management
  async memberRemoved(
    adminUserId: number,
    removedUserId: number,
    removedUserEmail: string,
    companyId: number
  ) {
    await createAuditLog({
      action: "MEMBER_REMOVED",
      userId: adminUserId,
      companyId,
      metadata: { removedUserId, removedUserEmail },
      level: "INFO",
    });
  },

  // Admin actions
  async adminLogin(username: string, request: Request) {
    const { ipAddress, userAgent } = getRequestInfo(request);
    await createAuditLog({
      action: "ADMIN_LOGIN",
      ipAddress,
      userAgent,
      metadata: { username },
      level: "INFO",
    });
  },

  // File operations
  async fileUploaded(userId: number, companyId: number, fileName: string, fileSize: number) {
    await createAuditLog({
      action: "FILE_UPLOADED",
      userId,
      companyId,
      metadata: { fileName, fileSize },
      level: "INFO",
    });
  },
};

