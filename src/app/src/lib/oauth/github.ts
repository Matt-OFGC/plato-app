// GitHub OAuth provider implementation
import { OAuthProvider, OAuthUser, OAuthConfig } from './base';

export class GitHubOAuthProvider implements OAuthProvider {
  name = 'github';
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: (this.config.scopes || ['user:email']).join(' '),
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async getToken(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get GitHub token: ${error}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    // GitHub tokens don't expire, but we'll set a far future date
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    return {
      accessToken: data.access_token,
      expiresAt,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUser> {
    // Get user profile
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      throw new Error(`Failed to get GitHub user profile: ${error}`);
    }

    const profile = await profileResponse.json();

    // Get user email (may need separate API call)
    let email = profile.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary) || emails[0];
        email = primaryEmail?.email;
      }
    }

    return {
      id: String(profile.id),
      email: email || `${profile.login}@users.noreply.github.com`,
      name: profile.name || profile.login,
      avatar: profile.avatar_url,
    };
  }
}

// Create GitHub OAuth provider instance
export function createGitHubProvider(): GitHubOAuthProvider {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/oauth/github/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  return new GitHubOAuthProvider({
    clientId,
    clientSecret,
    redirectUri,
  });
}

