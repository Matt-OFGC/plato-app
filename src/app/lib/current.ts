import { prisma } from './prisma';
import { getUserFromSession } from './auth-simple';
import type { App } from '@/lib/apps/types';
import type { AppConfig } from '@/lib/apps/types';
import { getAppConfig } from '@/lib/apps/registry';
import { logger } from './logger';
import { getOrCompute, CacheKeys, CACHE_TTL, deleteCache } from './redis';
import { generateDefaultCompanyName, generateCompanySlug } from './company-defaults';
import { auditLog } from './audit-log';
import { isFeatureEnabled } from './feature-flags';
import { checkRepairRateLimit } from './rate-limit-repair';

export interface Company {
  id: number;
  name: string;
  businessType?: string;
  country?: string;
  phone?: string;
  logoUrl?: string;
  app?: App;
}

export interface UserWithMemberships {
  id: number;
  email: string;
  name?: string;
  isAdmin: boolean;
  memberships: Array<{
    id: number;
    companyId: number;
    role: string;
    isActive: boolean;
    company: Company;
  }>;
}

export interface CurrentUserAndCompany {
  companyId: number | null;
  company: Company | null;
  user: UserWithMemberships;
  app?: App | null;
  appConfig?: AppConfig | null;
}

// Get current user and their company information with caching
export async function getCurrentUserAndCompany(): Promise<CurrentUserAndCompany> {
  const user = await getUserFromSession();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Use Redis cache with fallback
  return getOrCompute(
    CacheKeys.userSession(user.id),
    async () => {
      return await fetchUserAndCompany(user.id);
    },
    CACHE_TTL.USER_SESSION
  );
}

// Internal function to fetch user and company data
async function fetchUserAndCompany(userId: number): Promise<CurrentUserAndCompany> {

  try {
    // Optimized query - get only what we need
    const userWithMemberships = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        memberships: {
          where: { isActive: true },
          select: {
            id: true,
            companyId: true,
            role: true,
            isActive: true,
            company: {
              select: {
                id: true,
                name: true,
                businessType: true,
                country: true,
                phone: true,
                logoUrl: true,
                app: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 1 // Only get the first company for performance
        }
      }
    });

    // Handle multi-company users: ensure primary company is always accessible
    // If user has multiple companies, prioritize the first one they joined
    // Users can switch companies via company selector if needed

    if (!userWithMemberships) {
      throw new Error('User not found');
    }

    // Get the primary company (first active membership)
    let primaryMembership = userWithMemberships.memberships[0];
    let companyId = primaryMembership?.companyId || null;
    let company = primaryMembership?.company || null;
    
    // AUTO-REPAIR: If no active membership found, check for inactive ones
    if (!companyId) {
      const allMemberships = await prisma.membership.findMany({
        where: { userId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              businessType: true,
              country: true,
              phone: true,
              logoUrl: true,
              app: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // If user has inactive memberships, activate the first one
      if (allMemberships.length > 0) {
        // Check feature flag
        if (!isFeatureEnabled('AUTO_REPAIR_ACTIVATE_MEMBERSHIP', userId)) {
          logger.debug(`Auto-repair disabled by feature flag for user ${userId}`, {}, 'Current');
          // Fall through to return null
        } else {
          // Check rate limit
          const rateLimitCheck = await checkRepairRateLimit(userId);
          if (!rateLimitCheck.allowed) {
            logger.warn(`Auto-repair rate limit exceeded for user ${userId}`, {
              userId,
              resetAt: rateLimitCheck.resetAt,
            }, 'Current');
            // Fall through to return null
          } else {
            const inactiveMembership = allMemberships[0];
            logger.warn(`Auto-repair: Activating inactive membership for user ${userId}`, {
              userId,
              membershipId: inactiveMembership.id,
              companyId: inactiveMembership.companyId,
              reason: 'inactive_membership'
            }, 'Current');
            
            await prisma.membership.update({
              where: { id: inactiveMembership.id },
              data: { isActive: true }
            });
        
            // Log auto-repair
            await auditLog.autoRepair(
              userId,
              inactiveMembership.companyId,
              'inactive_membership',
              {
                membershipId: inactiveMembership.id,
                companyId: inactiveMembership.companyId,
                companyName: inactiveMembership.company.name,
              }
            );
            
            // Clear cache and refetch
            await deleteCache(CacheKeys.userSession(userId));
            
            // Return the activated membership
            companyId = inactiveMembership.companyId;
            company = inactiveMembership.company as Company;
          }
        }
      } else {
        // AUTO-REPAIR: User has no memberships at all - create company and membership
        // Check feature flag
        if (!isFeatureEnabled('AUTO_REPAIR_CREATE_COMPANY', userId)) {
          logger.debug(`Auto-repair create company disabled by feature flag for user ${userId}`, {}, 'Current');
          // Fall through to return null
        } else {
          // Check rate limit
          const rateLimitCheck = await checkRepairRateLimit(userId);
          if (!rateLimitCheck.allowed) {
            logger.warn(`Auto-repair rate limit exceeded for user ${userId}`, {
              userId,
              resetAt: rateLimitCheck.resetAt,
            }, 'Current');
            // Fall through to return null
          } else {
            logger.warn(`Auto-repair: Creating company and membership for orphaned user ${userId}`, {
              userId,
              email: userWithMemberships.email,
              reason: 'no_membership'
            }, 'Current');
            
            const defaultCompanyName = generateDefaultCompanyName(userWithMemberships.email);
            const slug = await generateCompanySlug(defaultCompanyName);
            
            const repairResult = await prisma.$transaction(async (tx) => {
          // Create company
          const newCompany = await tx.company.create({
            data: {
              name: defaultCompanyName,
              slug,
              country: 'United Kingdom',
            },
          });
          
          // Create active membership
          const newMembership = await tx.membership.create({
            data: {
              userId,
              companyId: newCompany.id,
              role: 'OWNER',
              isActive: true, // Explicitly set to true
            },
          });
          
            return { company: newCompany, membership: newMembership };
          });
          
          // Clear cache
          await deleteCache(CacheKeys.userSession(userId));
          
          // Log auto-repair
          await auditLog.autoRepair(
            userId,
            repairResult.company.id,
            'orphaned_user',
            {
              companyId: repairResult.company.id,
              companyName: repairResult.company.name,
              membershipId: repairResult.membership.id,
              role: repairResult.membership.role,
            }
          );
          
          logger.info(`Auto-repair successful: Created company ${repairResult.company.id} for user ${userId}`);
          
          // Set company data
          companyId = repairResult.company.id;
          company = {
            id: repairResult.company.id,
            name: repairResult.company.name,
            businessType: repairResult.company.businessType || undefined,
            country: repairResult.company.country || undefined,
            phone: repairResult.company.phone || undefined,
            logoUrl: repairResult.company.logoUrl || undefined,
              app: repairResult.company.app as App | undefined,
            };
          }
        }
      }
    }
    
    // After auto-repair, companyId should always exist, but handle edge case
    if (!companyId || !company) {
      // This should never happen, but log and return fallback
      logger.error('getCurrentUserAndCompany: companyId still null after auto-repair', {
        userId,
        email: userWithMemberships.email,
      }, 'Current');
      
      // Return fallback - user can still access but with limited functionality
      return {
        companyId: null,
        company: null,
        user: userWithMemberships,
        app: null,
        appConfig: null
      };
    }
    
    // Get app config if company has an app
    const app = company.app || null;
    const appConfig = app ? getAppConfig(app) : null;

    return {
      companyId,
      company,
      user: userWithMemberships,
      app,
      appConfig
    };
  } catch (error) {
    logger.error('Database error in getCurrentUserAndCompany', error, 'Current');
    
    // In development, provide more detailed error information
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Database connection failed. Check your .env file and DATABASE_URL.', error, 'Current');
    }
    
    // Return a fallback structure to prevent page crashes
    const user = await getUserFromSession();
    return {
      companyId: null,
      company: null,
      user: {
        id: user?.id || 0,
        email: user?.email || '',
        name: user?.name || null,
        isAdmin: user?.isAdmin || false,
        memberships: []
      },
      app: null,
      appConfig: null
    };
  }
}

// Clear user cache (call when user data changes)
export async function clearUserCache(userId?: number) {
  if (userId) {
    await deleteCache(CacheKeys.userSession(userId));
    // Note: userCompanies cache key may not exist, handle gracefully
    try {
      await deleteCache(CacheKeys.userCompanies?.(userId));
    } catch {
      // Cache key doesn't exist, that's OK
    }
  }
  // Note: Pattern deletion for all users requires deleteCachePattern which is async
  // For now, we'll clear individual caches as needed
}

// Get user's role in a specific company with caching
export async function getUserRoleInCompany(userId: number, companyId: number): Promise<string | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId
      }
    },
    select: {
      role: true,
      isActive: true
    }
  });

  return membership?.isActive ? membership.role : null;
}

// Check if user has access to a company
export async function hasCompanyAccess(userId: number, companyId: number): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId
      }
    },
    select: {
      isActive: true
    }
  });

  return membership?.isActive || false;
}