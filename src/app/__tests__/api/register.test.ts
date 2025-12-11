import { POST } from '@/api/register/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed_password')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/company-defaults', () => ({
  generateDefaultCompanyName: jest.fn((email: string) => 'My Company'),
  generateCompanySlug: jest.fn(() => Promise.resolve('my-company')),
}));

jest.mock('@/lib/current', () => ({
  clearUserCache: jest.fn(),
}));

jest.mock('@/lib/audit-log', () => ({
  auditLog: {
    register: jest.fn(),
    companyCreated: jest.fn(),
    membershipCreated: jest.fn(),
  },
}));

jest.mock('@/lib/email', () => ({
  sendWelcomeEmail: jest.fn(),
  sendEmailVerificationEmail: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true })),
  RATE_LIMITS: {
    REGISTER: {},
  },
}));

describe('POST /api/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create new user with company and membership in transaction', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

    const mockCompany = { id: 1, name: 'Test Company', slug: 'test-company' };
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
    const mockMembership = { id: 1, userId: 1, companyId: 1, role: 'OWNER', isActive: true };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        company: {
          create: jest.fn().mockResolvedValue(mockCompany),
        },
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        membership: {
          create: jest.fn().mockResolvedValue(mockMembership),
        },
      };
      return callback(tx);
    });

    const formData = new URLSearchParams({
      email: 'test@example.com',
      password: 'password123',
      company: 'Test Company',
      name: 'Test User',
      country: 'United Kingdom',
    });

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.companyId).toBe(1);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should handle existing user creating new company', async () => {
    const existingUser = {
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Test User',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);

    const mockCompany = { id: 2, name: 'New Company', slug: 'new-company' };
    const mockMembership = { id: 2, userId: 1, companyId: 2, role: 'ADMIN', isActive: true };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        company: {
          create: jest.fn().mockResolvedValue(mockCompany),
        },
        membership: {
          create: jest.fn().mockResolvedValue(mockMembership),
        },
      };
      return callback(tx);
    });

    const formData = new URLSearchParams({
      email: 'test@example.com',
      password: 'password123',
      company: 'New Company',
      name: 'Test User',
      country: 'United Kingdom',
    });

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.companyId).toBe(2);
  });

  it('should return error for invalid password when user exists', async () => {
    const existingUser = {
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Test User',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const formData = new URLSearchParams({
      email: 'test@example.com',
      password: 'wrong_password',
      company: 'Test Company',
      name: 'Test User',
    });

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Invalid password');
  });

  it('should auto-generate company name if not provided', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);

    const mockCompany = { id: 1, name: 'My Company', slug: 'my-company' };
    const mockUser = { id: 1, email: 'john@example.com', name: 'John' };
    const mockMembership = { id: 1, userId: 1, companyId: 1, role: 'OWNER', isActive: true };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        company: {
          create: jest.fn().mockResolvedValue(mockCompany),
        },
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        membership: {
          create: jest.fn().mockResolvedValue(mockMembership),
        },
      };
      return callback(tx);
    });

    const formData = new URLSearchParams({
      email: 'john@example.com',
      password: 'password123',
      name: 'John',
      // No company name provided
    });

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
