import { GET } from '@/app/api/test-auth/route';
import { NextRequest } from 'next/server';

// Mock the auth module
jest.mock('@/lib/auth-simple', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/current', () => ({
  getCurrentUserAndCompany: jest.fn(),
}));

describe('/api/test-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return success when authentication works', async () => {
    const { getSession } = require('@/lib/auth-simple');
    const { getCurrentUserAndCompany } = require('@/lib/current');

    getSession.mockResolvedValue({ id: 1, email: 'test@example.com' });
    getCurrentUserAndCompany.mockResolvedValue({ 
      user: { id: 1, email: 'test@example.com' }, 
      companyId: 1, 
      company: { id: 1, name: 'Test Company' } 
    });

    const request = new NextRequest('http://localhost:3000/api/test-auth');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.companyId).toBe(1);
  });

  test('should return null company when no session', async () => {
    const { getSession } = require('@/lib/auth-simple');
    const { getCurrentUserAndCompany } = require('@/lib/current');

    getSession.mockResolvedValue(null);
    getCurrentUserAndCompany.mockResolvedValue({ 
      user: null, 
      companyId: null, 
      company: null 
    });

    const request = new NextRequest('http://localhost:3000/api/test-auth');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.companyId).toBe(null);
  });
});
