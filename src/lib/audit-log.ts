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

// Export auditLog object for backwards compatibility
export const auditLog = {
  loginSuccess,
  loginFailed,
  logAction,
  logSystemEvent,
  // Additional convenience methods
  async register(userId: number, companyId: number, request: NextRequest): Promise<void> {
    await logAction(userId, 'USER_REGISTERED', 'user', String(userId), { companyId }, request);
  },
  async roleChanged(
    userId: number,
    targetUserId: number,
    oldRole: string,
    newRole: string,
    companyId: number
  ): Promise<void> {
    await logAction(userId, 'ROLE_CHANGED', 'membership', String(targetUserId), {
      targetUserId,
      oldRole,
      newRole,
      companyId,
    });
  },
  async fileUploaded(userId: number, companyId: number, filename: string, size: number): Promise<void> {
    await logAction(userId, 'FILE_UPLOADED', 'file', filename, { companyId, size });
  },
};
