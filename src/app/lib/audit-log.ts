import { NextRequest } from 'next/server';
import { prisma } from './prisma';

export interface AuditLogEntry {
  id?: number;
  userId?: number;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

// Get client information from request
function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress: ip, userAgent };
}

// Log successful login
export async function loginSuccess(userId: number, request: NextRequest): Promise<void> {
  try {
    const { ipAddress, userAgent } = getClientInfo(request);
    
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGIN_SUCCESS',
        resource: 'auth',
        details: { ipAddress, userAgent },
        ipAddress,
        userAgent,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log login success:', error);
  }
}

// Log failed login attempt
export async function loginFailed(email: string, request: NextRequest, reason: string): Promise<void> {
  try {
    const { ipAddress, userAgent } = getClientInfo(request);
    
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: email,
        details: { reason, ipAddress, userAgent },
        ipAddress,
        userAgent,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log login failure:', error);
  }
}

// Log user action
export async function logAction(
  userId: number,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: any,
  request?: NextRequest
): Promise<void> {
  try {
    const clientInfo = request ? getClientInfo(request) : {};
    
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}

// Log system event
export async function logSystemEvent(
  action: string,
  resource?: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        resource,
        resourceId,
        details,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log system event:', error);
  }
}

// Get audit logs for a user
export async function getUserAuditLogs(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });
    
    return logs;
  } catch (error) {
    console.error('Failed to get user audit logs:', error);
    return [];
  }
}

// Get recent audit logs
export async function getRecentAuditLogs(
  limit: number = 100,
  offset: number = 0
): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    return logs;
  } catch (error) {
    console.error('Failed to get recent audit logs:', error);
    return [];
  }
}

// Audit log object with company/membership tracking methods
export const auditLog = {
  // Log registration (creates ActivityLog entry)
  async register(userId: number, companyId: number, request: NextRequest): Promise<void> {
    try {
      const { ipAddress, userAgent } = getClientInfo(request);
      
      await prisma.activityLog.create({
        data: {
          userId,
          companyId,
          action: 'REGISTER',
          entity: 'User',
          entityId: userId,
          details: {
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString(),
          },
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log registration:', error);
    }
  },

  // Log company creation
  async companyCreated(
    userId: number,
    companyId: number,
    companyName: string,
    request?: NextRequest
  ): Promise<void> {
    try {
      const clientInfo = request ? getClientInfo(request) : {};
      
      await prisma.activityLog.create({
        data: {
          userId,
          companyId,
          action: 'CREATE',
          entity: 'Company',
          entityId: companyId,
          entityName: companyName,
          details: {
            ...clientInfo,
            timestamp: new Date().toISOString(),
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log company creation:', error);
    }
  },

  // Log company update
  async companyUpdated(
    userId: number,
    companyId: number,
    changes: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    try {
      const clientInfo = request ? getClientInfo(request) : {};
      
      await prisma.activityLog.create({
        data: {
          userId,
          companyId,
          action: 'UPDATE',
          entity: 'Company',
          entityId: companyId,
          details: {
            changes,
            ...clientInfo,
            timestamp: new Date().toISOString(),
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log company update:', error);
    }
  },

  // Log membership creation
  async membershipCreated(
    userId: number,
    companyId: number,
    membershipId: number,
    role: string,
    reason?: string,
    request?: NextRequest
  ): Promise<void> {
    try {
      const clientInfo = request ? getClientInfo(request) : {};
      
      await prisma.activityLog.create({
        data: {
          userId,
          companyId,
          action: 'CREATE',
          entity: 'Membership',
          entityId: membershipId,
          details: {
            role,
            reason: reason || 'manual',
            ...clientInfo,
            timestamp: new Date().toISOString(),
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log membership creation:', error);
    }
  },

  // Log membership activation/deactivation
  async membershipStatusChanged(
    userId: number,
    companyId: number,
    membershipId: number,
    oldStatus: boolean,
    newStatus: boolean,
    reason: string,
    request?: NextRequest
  ): Promise<void> {
    try {
      const clientInfo = request ? getClientInfo(request) : {};
      
      await prisma.activityLog.create({
        data: {
          userId,
          companyId,
          action: newStatus ? 'ACTIVATE' : 'DEACTIVATE',
          entity: 'Membership',
          entityId: membershipId,
          details: {
            oldStatus,
            newStatus,
            reason,
            ...clientInfo,
            timestamp: new Date().toISOString(),
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log membership status change:', error);
    }
  },

  // Log auto-repair actions
  async autoRepair(
    userId: number,
    companyId: number | null,
    repairType: 'orphaned_user' | 'inactive_membership',
    details: Record<string, any>
  ): Promise<void> {
    try {
      // Use system event logging if no companyId
      if (!companyId) {
        await logSystemEvent(
          'AUTO_REPAIR',
          'User',
          userId.toString(),
          {
            repairType,
            ...details,
            timestamp: new Date().toISOString(),
          }
        );
        return;
      }

      await prisma.activityLog.create({
        data: {
          userId,
          companyId,
          action: 'AUTO_REPAIR',
          entity: 'Membership',
          details: {
            repairType,
            ...details,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log auto-repair:', error);
    }
  },

  async recipeDeleted(
    userId: number,
    recipeId: number,
    recipeName: string,
    companyId: number | null
  ): Promise<void> {
    try {
      if (!companyId) {
        await logSystemEvent(
          'DELETE',
          'Recipe',
          recipeId.toString(),
          {
            recipeName,
            timestamp: new Date().toISOString(),
          }
        );
        return;
      }

      await prisma.activityLog.create({
        data: {
          userId,
          companyId,
          action: 'DELETE',
          entity: 'Recipe',
          entityId: recipeId,
          entityName: recipeName,
          details: {
            recipeName,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log recipe deletion:', error);
    }
  },

  async ingredientUpdated(
    userId: number,
    ingredientId: number,
    ingredientName: string,
    companyId: number | null,
    changes: Record<string, any>
  ): Promise<void> {
    try {
      if (!companyId) {
        await logSystemEvent(
          'UPDATE',
          'Ingredient',
          ingredientId.toString(),
          {
            ingredientName,
            changes,
            timestamp: new Date().toISOString(),
          }
        );
        return;
      }

      await prisma.activityLog.create({
        data: {
          userId,
          companyId,
          action: 'UPDATE',
          entity: 'Ingredient',
          entityId: ingredientId,
          entityName: ingredientName,
          details: {
            ingredientName,
            changes,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log ingredient update:', error);
    }
  },
};
