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
  // Note: app field exists in schema but not in database - using user-level subscriptions instead
}

export interface UserWithMemberships {
  id: number;
  email: string;
  name?: string;
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
  try {
    const user = await getUserFromSession();
    
    if (!user) {
      // Return fallback instead of throwing to prevent error boundaries
      logger.warn('getCurrentUserAndCompany: User not authenticated', {}, 'Current');
      return {
        companyId: null,
        company: null,
        user: {
          id: 0,
          email: '',
          name: undefined,
          memberships: []
        },
        app: null,
        appConfig: null
      };
    }

    // Temporarily bypass cache to avoid import issues - Redis is placeholder anyway
    // TODO: Re-enable cache once Redis is properly configured
    try {
      return await fetchUserAndCompany(user.id);
    } catch (fetchError: any) {
      // If fetch fails, log and let outer catch handle it
      logger.error('fetchUserAndCompany failed', {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        userId: user.id
      }, 'Current');
      throw fetchError;
    }
  } catch (error) {
    // Log the error but don't throw - return fallback to prevent page crashes
    logger.error('getCurrentUserAndCompany: Critical error', error, 'Current');
    
    // Try to get at least the user session
    try {
      const user = await getUserFromSession();
      return {
        companyId: null,
        company: null,
        user: {
          id: user?.id || 0,
          email: user?.email || '',
          name: user?.name || undefined,
          memberships: []
        },
        app: null,
        appConfig: null
      };
    } catch {
      // Last resort fallback
      return {
        companyId: null,
        company: null,
        user: {
          id: 0,
          email: '',
          name: undefined,
          memberships: []
        },
        app: null,
        appConfig: null
      };
    }
  }
}

// Internal function to fetch user and company data
async function fetchUserAndCompany(userId: number): Promise<CurrentUserAndCompany> {

  try {
    // Optimized query - get only what we need
    // Retry logic: if query fails due to schema mismatch (e.g., missing 'app' field), retry without it
    let userWithMemberships;
    try {
      userWithMemberships = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
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
                  logoUrl: true
                }
              }
            },
            orderBy: { createdAt: 'asc' },
            take: 1 // Only get the first company for performance
          }
        }
      });
    } catch (queryError: any) {
      // If query fails due to schema mismatch, retry without app field as fallback
      if (queryError?.message?.includes('Unknown field') || queryError?.message?.includes('app')) {
        logger.warn('Retrying query without app field due to schema mismatch', {}, 'Current');
        // Retry without app field as fallback
        userWithMemberships = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
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
                    logoUrl: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' },
              take: 1
            }
          }
        });
      } else {
        throw queryError;
      }
    }

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
    
    // Log if user has no memberships for debugging
    if (userWithMemberships.memberships.length === 0) {
      logger.warn('User has no memberships', {
        userId,
        email: userWithMemberships.email
      }, 'Current');
    }
    
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
              logoUrl: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // If user has inactive memberships, use the first one (even if inactive)
      // This ensures users can always access their companies
      if (allMemberships.length > 0) {
        const inactiveMembership = allMemberships[0];
        
        // Always use the membership - don't require activation
        companyId = inactiveMembership.companyId;
        company = inactiveMembership.company as Company;
        
        // Try to activate if feature flag allows (but don't block on it)
        const shouldActivate = isFeatureEnabled('AUTO_REPAIR_ACTIVATE_MEMBERSHIP', userId);
        if (shouldActivate && !inactiveMembership.isActive) {
          // Check rate limit
          const rateLimitCheck = await checkRepairRateLimit(userId);
          if (rateLimitCheck.allowed) {
            try {
              await prisma.membership.update({
                where: { id: inactiveMembership.id },
                data: { isActive: true }
              });
              
              logger.info(`Auto-repair: Activated inactive membership for user ${userId}`, {
                userId,
                membershipId: inactiveMembership.id,
                companyId: inactiveMembership.companyId,
              }, 'Current');
              
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
            } catch (activateError) {
              // Don't fail if activation fails - we already have the company
              logger.warn('Failed to activate membership, but using it anyway', {
                error: activateError instanceof Error ? activateError.message : String(activateError),
                userId,
                membershipId: inactiveMembership.id
              }, 'Current');
            }
          }
        }
      } else {
        // AUTO-REPAIR: User has no memberships at all - create company and membership
        // Always try to create - don't block on feature flags or rate limits in dev
        const shouldCreate = isFeatureEnabled('AUTO_REPAIR_CREATE_COMPANY', userId);
        const rateLimitCheck = await checkRepairRateLimit(userId);
        
        if (shouldCreate && rateLimitCheck.allowed) {
            logger.warn(`Auto-repair: Creating company and membership for orphaned user ${userId}`, {
              userId,
              email: userWithMemberships.email,
              reason: 'no_membership'
            }, 'Current');
            
            const defaultCompanyName = generateDefaultCompanyName(userWithMemberships.email);
            const slug = await generateCompanySlug(defaultCompanyName);
            
            const repairResult = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
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
              role: 'ADMIN',
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
            logoUrl: repairResult.company.logoUrl || undefined
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
    
    // App is user-level subscription, not company-level
    // Note: Company schema has app field but database doesn't - using user subscriptions instead
    const app = null;
    const appConfig = null;

    return {
      companyId,
      company,
      user: userWithMemberships,
      app,
      appConfig
    };
  } catch (error) {
    logger.error('Database error in fetchUserAndCompany', error, 'Current');
    
    // In development, provide more detailed error information
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Database connection failed. Check your .env file and DATABASE_URL.', error, 'Current');
    }
    
    // Return a fallback structure to prevent page crashes
    // Try to get user from session, but don't fail if that also errors
    try {
      const user = await getUserFromSession();
      return {
        companyId: null,
        company: null,
        user: {
          id: user?.id || 0,
          email: user?.email || '',
          name: user?.name || undefined,
          memberships: []
        },
        app: null,
        appConfig: null
      };
    } catch (sessionError) {
      // Last resort - return empty structure
      logger.error('Failed to get user session in error handler', sessionError, 'Current');
      return {
        companyId: null,
        company: null,
        user: {
          id: 0,
          email: '',
          name: undefined,
          memberships: []
        },
        app: null,
        appConfig: null
      };
    }
  }
}

// Clear user cache (call when user data changes)
export async function clearUserCache(userId?: number) {
  if (userId) {
    await deleteCache(CacheKeys.userSession(userId));
    // Note: userCompanies cache key may not exist, handle gracefully
    try {
      await deleteCache(CacheKeys.userCompanies(userId));
    } catch {
      // Cache key doesn't exist, that's OK
    }
  }
  // Note: Pattern deletion for all users requires deleteCachePattern which is async
  // For now, we'll clear individual caches as needed
}

// Get user's role in a specific company with caching
export async function getUserRoleInCompany(userId: number, companyId: number): Promise<string | null> {
  try {
    // Check if CacheKeys.userRole exists (handles cached code issues)
    if (!CacheKeys.userRole || typeof CacheKeys.userRole !== 'function') {
      logger.warn('CacheKeys.userRole not available, fetching directly', { userId, companyId }, 'Current');
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
    
    return await getOrCompute(
      CacheKeys.userRole(userId, companyId),
      async () => {
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
      },
      CACHE_TTL.USER_ROLE
    );
  } catch (error: any) {
    // Fallback if cache fails (handles cached code issues)
    if (error?.message?.includes('is not a function') || error?.message?.includes('userRole')) {
      logger.warn('Cache error in getUserRoleInCompany, fetching directly', { 
        error: error instanceof Error ? error.message : String(error),
        userId, 
        companyId 
      }, 'Current');
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
    throw error;
  }
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

/**
 * Helper function to check if company data is available
 * Returns true if companyId exists, false otherwise
 * Useful for quick null checks in server components
 */
export function hasCompany(result: CurrentUserAndCompany): result is CurrentUserAndCompany & { companyId: number; company: Company } {
  return result.companyId !== null && result.company !== null;
}