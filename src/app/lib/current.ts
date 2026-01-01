import { prisma } from './prisma';
import { getUserFromSession } from './auth-simple';
import type { App } from '@/lib/apps/types';
import type { AppConfig } from '@/lib/apps/types';
import { getAppConfig } from '@/lib/apps/registry';
import { logger } from './logger';
import { CacheKeys, deleteCache } from './redis';
import { generateDefaultCompanyName, generateCompanySlug } from './company-defaults';

export interface Company {
  id: number;
  name: string;
  businessType?: string;
  country?: string;
  phone?: string;
  logoUrl?: string;
  // Note: app field removed from schema - apps are now user-level subscriptions only
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
// Simplified: Just get user's first active membership's company
// No auto-repair, no fallbacks - registration should handle company creation
async function fetchUserAndCompany(userId: number): Promise<CurrentUserAndCompany> {
  try {
    // Simple query: get user's first active membership's company
    const userWithMemberships = await prisma.user.findUnique({
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

    if (!userWithMemberships) {
      throw new Error('User not found');
    }

    // Get the primary company (first active membership)
    let primaryMembership = userWithMemberships.memberships[0];
    let companyId = primaryMembership?.companyId || null;
    let company = primaryMembership?.company || null;
    
    // If no active membership, check for inactive ones (simple fallback)
    // Don't auto-create companies, but use existing memberships if they exist
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
        orderBy: { createdAt: 'asc' },
        take: 1
      });
      
      if (allMemberships.length > 0) {
        const membership = allMemberships[0];
        companyId = membership.companyId;
        company = membership.company as Company;
        
        // Try to activate if inactive (but don't fail if it doesn't work)
        if (!membership.isActive) {
          try {
            await prisma.membership.update({
              where: { id: membership.id },
              data: { isActive: true }
            });
            logger.info(`Activated inactive membership for user ${userId}`, {
              userId,
              membershipId: membership.id,
              companyId: membership.companyId
            }, 'Current');
          } catch (activateError) {
            // Don't fail - use the membership anyway
            logger.warn('Failed to activate membership, using it anyway', {
              error: activateError instanceof Error ? activateError.message : String(activateError),
              userId,
              membershipId: membership.id
            }, 'Current');
          }
        }
      }
    }
    
    // If still no company, create one as a safety net
    // This handles edge cases where registration didn't complete properly
    if (!companyId || !company) {
      logger.warn('User has no memberships - creating company as safety net', {
        userId,
        email: userWithMemberships.email
      }, 'Current');
      
      try {
        const defaultCompanyName = generateDefaultCompanyName(userWithMemberships.email);
        const slug = await generateCompanySlug(defaultCompanyName);
        
        const result = await prisma.$transaction(async (tx) => {
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
              isActive: true,
            },
          });
          
          return { company: newCompany, membership: newMembership };
        });
        
        // Clear cache
        await deleteCache(CacheKeys.userSession(userId));
        
        logger.info(`Created company ${result.company.id} for user ${userId} (safety net)`);
        
        // Set company data
        companyId = result.company.id;
        company = {
          id: result.company.id,
          name: result.company.name,
          businessType: result.company.businessType || undefined,
          country: result.company.country || undefined,
          phone: result.company.phone || undefined,
          logoUrl: result.company.logoUrl || undefined
        };
      } catch (createError) {
        logger.error('Failed to create company as safety net', {
          error: createError instanceof Error ? createError.message : String(createError),
          userId
        }, 'Current');
        
        // Return null if creation fails
        return {
          companyId: null,
          company: null,
          user: userWithMemberships,
          app: null,
          appConfig: null
        };
      }
    }
    
    // App is user-level subscription, not company-level
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
    logger.error('Database error in fetchUserAndCompany', {
      error: error instanceof Error ? error.message : String(error),
      userId
    }, 'Current');
    
    // Return fallback structure
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

// Get user's role in a specific company
// Temporarily bypass cache to avoid import issues
export async function getUserRoleInCompany(userId: number, companyId: number): Promise<string | null> {
  try {
    // Direct fetch - bypass cache to avoid Redis import issues
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
  } catch (error: any) {
    logger.error('Error fetching user role in company', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      companyId
    }, 'Current');
    return null;
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