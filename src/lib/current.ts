import { prisma } from './prisma';
import { getUserFromSession } from './auth-simple';
import type { Brand } from '@/lib/brands/types';
import type { BrandConfig } from '@/lib/brands/types';
import { getBrandConfig, brandExists } from '@/lib/brands/registry';
import type { App } from '@/lib/apps/types';
import type { AppConfig } from '@/lib/apps/types';
import { getAppConfig } from '@/lib/apps/registry';
import { logger } from './logger';
import { getCache, setCache, deleteCache, CACHE_TTL, CacheKeys } from './redis';

export interface Company {
  id: number;
  name: string;
  businessType?: string;
  country?: string;
  phone?: string;
  logoUrl?: string;
  brand?: Brand;
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
  brand?: Brand | null;
  brandConfig?: BrandConfig | null;
  app?: App | null;
  appConfig?: AppConfig | null;
}

// Get current user and their company information with caching
export async function getCurrentUserAndCompany(): Promise<CurrentUserAndCompany> {
  const user = await getUserFromSession();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const cacheKey = CacheKeys.userSession(user.id);
  // Check Redis cache first (silently fail if Redis unavailable)
  let cached: CurrentUserAndCompany | null = null;
  try {
    cached = await getCache<CurrentUserAndCompany>(cacheKey);
  } catch (error) {
    // Redis unavailable, continue without cache
  }
  if (cached) {
    return cached;
  }

  try {
    // First, check if user has any memberships at all (including inactive)
    const userWithAllMemberships = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        memberships: {
          select: {
            id: true,
            companyId: true,
            role: true,
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
        }
      }
    });

    if (!userWithAllMemberships) {
      throw new Error('User not found');
    }

    // If user has memberships but none are active, activate the first one
    const inactiveMemberships = userWithAllMemberships.memberships.filter(m => !m.isActive);
    const activeMemberships = userWithAllMemberships.memberships.filter(m => m.isActive);
    
    if (inactiveMemberships.length > 0 && activeMemberships.length === 0) {
      // User has memberships but none are active - activate the first one
      logger.info(`Activating inactive membership for user ${user.id}`, { membershipId: inactiveMemberships[0].id }, 'Current');
      await prisma.membership.update({
        where: { id: inactiveMemberships[0].id },
        data: { isActive: true }
      });
      // Clear cache so next call gets fresh data
      await deleteCache(CacheKeys.userSession(user.id));
    }

    // Now get active memberships with company details
    const userWithMemberships = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!userWithMemberships) {
      throw new Error('User not found');
    }

    // Get the primary company (first active membership)
    const primaryMembership = userWithMemberships.memberships[0];
    const companyId = primaryMembership?.companyId || null;
    const company = primaryMembership?.company || null;
    
    // Get app config if company has an app
    const app = company?.app || null;
    const appConfig = app ? getAppConfig(app) : null;
    
    // For backward compatibility, use app as brand
    const brand = app as Brand | null;
    let brandConfig: BrandConfig | null = null;
    try {
      brandConfig = brand && brandExists(brand) ? getBrandConfig(brand) : null;
    } catch (error) {
      // Brand config not available, continue without it
      logger.debug('Brand config not available', error, 'Current');
    }

    const result = {
      companyId,
      company,
      user: userWithMemberships,
      brand,
      brandConfig,
      app,
      appConfig
    };

    // Cache the result in Redis (silently fail if Redis unavailable)
    try {
      await setCache(cacheKey, result, CACHE_TTL.USER_SESSION);
    } catch (error) {
      // Redis unavailable, continue without caching
    }

    return result;
  } catch (error) {
    logger.error('Database error in getCurrentUserAndCompany', error, 'Current');
    
    // In development, provide more detailed error information
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Database connection failed. Check your .env file and DATABASE_URL.', error, 'Current');
      console.error('getCurrentUserAndCompany error details:', error);
      
      // Try to check if user has memberships even if main query failed
      try {
        const memberships = await prisma.membership.findMany({
          where: { userId: user.id },
          select: { id: true, companyId: true, isActive: true, role: true },
        });
        console.error(`User ${user.id} has ${memberships.length} membership(s). Active: ${memberships.filter(m => m.isActive).length}`);
        if (memberships.length > 0 && memberships.filter(m => m.isActive).length === 0) {
          console.error('User has memberships but none are active. Activating first membership...');
          await prisma.membership.update({
            where: { id: memberships[0].id },
            data: { isActive: true }
          });
          // Clear cache and retry
          await deleteCache(CacheKeys.userSession(user.id));
          return await fetchUserAndCompany(userId);
        }
      } catch (retryError) {
        console.error('Error checking/activating memberships:', retryError);
      }
    }
    
    // Return a fallback structure to prevent page crashes
    return {
      companyId: null,
      company: null,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        memberships: []
      },
      brand: null,
      brandConfig: null,
      app: null,
      appConfig: null
    };
  }
}

// Clear user cache (call when user data changes)
export async function clearUserCache(userId?: number) {
  if (userId) {
    await deleteCache(CacheKeys.userSession(userId));
    await deleteCache(CacheKeys.userCompanies(userId)); // Clear user's companies list
  } else {
    // If no specific user, clear all user sessions and user companies (less efficient, use sparingly)
    // Pattern deletion would require deleteCachePattern, but for now we'll clear individual caches
  }
}

// Get user's role in a specific company with caching
export async function getUserRoleInCompany(userId: number, companyId: number): Promise<string | null> {
  const cacheKey = CacheKeys.userRole(userId, companyId);
  const cachedRole = await getCache<string>(cacheKey);
  if (cachedRole) {
    return cachedRole;
  }

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

  const role = membership?.isActive ? membership.role : null;
  if (role) {
    await setCache(cacheKey, role, CACHE_TTL.USER_SESSION);
  }
  return role;
}

// Check if user has access to a company
export async function hasCompanyAccess(userId: number, companyId: number): Promise<boolean> {
  const cacheKey = CacheKeys.companyAccess(userId, companyId);
  const cachedAccess = await getCache<boolean>(cacheKey);
  if (cachedAccess !== null) { // Check for null explicitly as false is a valid value
    return cachedAccess;
  }

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

  const hasAccess = membership?.isActive || false;
  await setCache(cacheKey, hasAccess, CACHE_TTL.USER_SESSION);
  return hasAccess;
}
