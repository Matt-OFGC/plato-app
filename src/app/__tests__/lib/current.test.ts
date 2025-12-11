import { getCurrentUserAndCompany } from '@/lib/current';
import { prisma } from '@/lib/prisma';
import { getUserFromSession } from '@/lib/auth-simple';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    membership: {
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    company: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth-simple', () => ({
  getUserFromSession: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  getOrCompute: jest.fn((key, fn) => fn()),
  deleteCache: jest.fn(),
  CacheKeys: {
    userSession: (id: number) => `user:session:${id}`,
  },
  CACHE_TTL: {
    USER_SESSION: 300,
  },
}));

jest.mock('@/lib/company-defaults', () => ({
  generateDefaultCompanyName: jest.fn((email: string) => 'My Company'),
  generateCompanySlug: jest.fn(() => Promise.resolve('my-company')),
}));

jest.mock('@/lib/audit-log', () => ({
  auditLog: {
    autoRepair: jest.fn(),
  },
}));

jest.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

describe('getCurrentUserAndCompany', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return company when user has active membership', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: false,
      memberships: [
        {
          id: 1,
          companyId: 1,
          role: 'OWNER',
          isActive: true,
          company: {
            id: 1,
            name: 'Test Company',
            businessType: 'Bakery',
            country: 'United Kingdom',
            phone: null,
            logoUrl: null,
            app: 'plato',
          },
        },
      ],
    });

    const result = await getCurrentUserAndCompany();

    expect(result.companyId).toBe(1);
    expect(result.company?.name).toBe('Test Company');
    expect(result.user.id).toBe(1);
  });

  it('should auto-repair orphaned user by creating company and membership', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: false,
      memberships: [], // No memberships
    });

    (prisma.membership.findMany as jest.Mock).mockResolvedValue([]);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'My Company',
        slug: 'my-company',
        country: 'United Kingdom',
        businessType: null,
        phone: null,
        logoUrl: null,
        app: 'plato',
      },
      {
        id: 1,
        userId: 1,
        companyId: 1,
        role: 'OWNER',
        isActive: true,
      },
    ]);

    const result = await getCurrentUserAndCompany();

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.companyId).toBe(1);
  });

  it('should auto-activate inactive membership', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: false,
      memberships: [], // No active memberships
    });

    (prisma.membership.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        companyId: 1,
        role: 'OWNER',
        isActive: false,
        company: {
          id: 1,
          name: 'Test Company',
          businessType: 'Bakery',
          country: 'United Kingdom',
          phone: null,
          logoUrl: null,
          app: 'plato',
        },
      },
    ]);

    (prisma.membership.update as jest.Mock).mockResolvedValue({
      id: 1,
      isActive: true,
    });

    const result = await getCurrentUserAndCompany();

    expect(prisma.membership.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isActive: true },
    });
    expect(result.companyId).toBe(1);
  });

  it('should throw error when user not authenticated', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue(null);

    await expect(getCurrentUserAndCompany()).rejects.toThrow('User not authenticated');
  });
});
