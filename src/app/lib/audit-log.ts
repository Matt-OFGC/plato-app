import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { logger } from './logger';

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
    logger.error('Failed to log login success', error, 'AuditLog');
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
    logger.error('Failed to log login failure', error, 'AuditLog');
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
    logger.error('Failed to log action', error, 'AuditLog');
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
    logger.error('Failed to log system event', error, 'AuditLog');
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
    logger.error('Failed to get user audit logs', error, 'AuditLog');
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
    logger.error('Failed to get recent audit logs', error, 'AuditLog');
    return [];
  }
}
