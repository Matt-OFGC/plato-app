// Base OAuth provider interface and utilities
import { prisma } from '../prisma';

export interface OAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface OAuthProvider {
  name: string;
  getAuthUrl(state: string): string;
  getToken(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
  getUserInfo(accessToken: string): Promise<OAuthUser>;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

// Link OAuth account to user
export async function linkOAuthAccount(
  userId: number,
  provider: string,
  providerId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date
): Promise<void> {
  await prisma.oauthAccount.upsert({
    where: {
      provider_providerId: {
        provider,
        providerId,
      },
    },
    create: {
      userId,
      provider,
      providerId,
      accessToken,
      refreshToken,
      expiresAt,
    },
    update: {
      accessToken,
      refreshToken,
      expiresAt,
    },
  });
}

// Find user by OAuth account
export async function findUserByOAuthAccount(
  provider: string,
  providerId: string
): Promise<number | null> {
  const account = await prisma.oauthAccount.findUnique({
    where: {
      provider_providerId: {
        provider,
        providerId,
      },
    },
    select: {
      userId: true,
    },
  });

  return account?.userId || null;
}

// Get OAuth accounts for a user
export async function getUserOAuthAccounts(userId: number) {
  return prisma.oauthAccount.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      providerId: true,
      createdAt: true,
    },
  });
}

// Unlink OAuth account
export async function unlinkOAuthAccount(userId: number, provider: string): Promise<void> {
  await prisma.oauthAccount.deleteMany({
    where: {
      userId,
      provider,
    },
  });
}

