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

// Get current user and their company information
export async function getCurrentUserAndCompany(): Promise<CurrentUserAndCompany> {
  const user = await getUserFromSession();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user with their memberships and companies
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
        orderBy: { createdAt: 'asc' } // Get the first company they joined
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

  return {
    companyId,
    company,
    user: userWithMemberships
  };
}

// Get user's role in a specific company
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
