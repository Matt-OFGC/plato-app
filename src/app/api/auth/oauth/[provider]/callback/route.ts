import { NextRequest, NextResponse } from "next/server";
import { getOAuthProvider, linkOAuthAccount, findUserByOAuthAccount } from "@/lib/oauth";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth-simple";
import { cookies } from "next/headers";
import { getAppFromRoute, getAppAwareRoute } from "@/lib/app-routes";
import { logger } from "@/lib/logger";
import type { App } from "@/lib/apps/types";

// Handle OAuth callback
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/login?error=oauth_invalid', request.url)
      );
    }

    // Verify state token
    const cookieStore = await cookies();
    const storedState = cookieStore.get(`oauth_state_${provider}`)?.value;
    
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/login?error=oauth_state_mismatch', request.url)
      );
    }

    // Clear state cookie
    cookieStore.delete(`oauth_state_${provider}`);
    
    // Detect app from referer or state (if we stored it)
    // TODO: Store app in OAuth state parameter for better detection
    let app: App | null = null;
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const url = new URL(referer);
        app = getAppFromRoute(url.pathname);
      } catch {
        // Invalid URL, ignore
      }
    }
    
    // Helper to get dashboard route
    const getDashboardRoute = (): string => {
      return getAppAwareRoute("/dashboard", app);
    };

    // Get OAuth provider
    const oauthProvider = getOAuthProvider(provider);
    if (!oauthProvider) {
      return NextResponse.redirect(
        new URL('/login?error=oauth_provider_unavailable', request.url)
      );
    }

    // Exchange code for access token
    const tokens = await oauthProvider.getToken(code);
    
    // Get user info from OAuth provider
    const oauthUser = await oauthProvider.getUserInfo(tokens.accessToken);

    // Check if OAuth account is already linked
    const existingUserId = await findUserByOAuthAccount(provider, oauthUser.id);

    if (existingUserId) {
      // User exists, log them in
      const user = await prisma.user.findUnique({
        where: { id: existingUserId },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return NextResponse.redirect(
          new URL('/login?error=account_inactive', request.url)
        );
      }

      // Update OAuth tokens
      await linkOAuthAccount(
        user.id,
        provider,
        oauthUser.id,
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiresAt
      );

      // Create session
      await createSession({
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        isAdmin: user.isAdmin,
      }, true, { headers: request.headers });

      return NextResponse.redirect(new URL(getDashboardRoute(), request.url));
    }

    // Check if user with this email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: oauthUser.email.toLowerCase().trim() },
    });

    if (existingUser) {
      // Link OAuth account to existing user
      await linkOAuthAccount(
        existingUser.id,
        provider,
        oauthUser.id,
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiresAt
      );

      // Create session
      await createSession({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name || undefined,
        isAdmin: existingUser.isAdmin,
      }, true, { headers: request.headers });

      return NextResponse.redirect(new URL(getDashboardRoute(), request.url));
    }

    // New user - create account and link OAuth
    const newUser = await prisma.user.create({
      data: {
        email: oauthUser.email.toLowerCase().trim(),
        name: oauthUser.name,
        emailVerified: true, // OAuth emails are pre-verified
        isActive: true,
      },
    });

    // Link OAuth account
    await linkOAuthAccount(
      newUser.id,
      provider,
      oauthUser.id,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresAt
    );

    // Create session
    await createSession({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name || undefined,
      isAdmin: newUser.isAdmin,
    }, true, { headers: request.headers });

    // Check if user has a company - if not, redirect to onboarding/company creation
    const membership = await prisma.membership.findFirst({
      where: { userId: newUser.id },
    });

    if (!membership) {
      // New OAuth user needs to create/join a company
      const dashboardRoute = getDashboardRoute();
      return NextResponse.redirect(new URL(`${dashboardRoute}?onboarding=true`, request.url));
    }

    // User has a company, go to dashboard
    return NextResponse.redirect(new URL(getDashboardRoute(), request.url));
  } catch (error) {
    logger.error(`OAuth callback error for ${provider}`, error, "Auth/OAuth");
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', request.url)
    );
  }
}

