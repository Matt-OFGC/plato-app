import { NextRequest, NextResponse } from "next/server";
import { getOAuthProvider } from "@/lib/oauth";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

// Initiate OAuth flow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const oauthProvider = getOAuthProvider(provider);

    if (!oauthProvider) {
      return NextResponse.json(
        { error: `OAuth provider "${provider}" is not available` },
        { status: 400 }
      );
    }

    // Generate state token for CSRF protection
    const state = randomBytes(32).toString('hex');
    
    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set(`oauth_state_${provider}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    });

    // Get authorization URL
    const authUrl = oauthProvider.getAuthUrl(state);

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error(`OAuth initiation error for ${provider}:`, error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}

