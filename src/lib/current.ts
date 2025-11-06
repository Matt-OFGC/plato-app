import { prisma } from './prisma';
import { getUserFromSession } from './auth-simple';

export interface Company {
  id: number;
  name: string;
  businessType?: string;
  country?: string;
  phone?: string;
  logoUrl?: string;
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
}

// Cache for user data to avoid repeated queries
const userCache = new Map<number, { data: CurrentUserAndCompany; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get current user and their company information with caching
export async function getCurrentUserAndCompany(): Promise<CurrentUserAndCompany> {
  const user = await getUserFromSession();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check cache first
  const cached = userCache.get(user.id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Optimized query - get only what we need
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
                logoUrl: true
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

    const result = {
      companyId,
      company,
      user: userWithMemberships
    };

    // Cache the result
    userCache.set(user.id, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('Database error in getCurrentUserAndCompany:', error);
    
    // In development, provide more detailed error information
    if (process.env.NODE_ENV === 'development') {
      console.error('Database connection failed. Check your .env file and DATABASE_URL.');
      console.error('Error details:', error);
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
      }
    };
  }
}

// Clear user cache (call when user data changes)
export function clearUserCache(userId?: number) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
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