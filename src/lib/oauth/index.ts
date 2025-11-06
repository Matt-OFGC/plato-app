// OAuth provider registry
import { OAuthProvider, linkOAuthAccount, findUserByOAuthAccount } from './base';
import { createGoogleProvider, GoogleOAuthProvider } from './google';
import { createGitHubProvider, GitHubOAuthProvider } from './github';

const providers = new Map<string, () => OAuthProvider>();

// Register providers
export function registerOAuthProviders() {
  try {
    providers.set('google', () => createGoogleProvider());
  } catch (error) {
    console.warn('Google OAuth not configured:', error);
  }

  // GitHub OAuth disabled - not needed
  // try {
  //   providers.set('github', () => createGitHubProvider());
  // } catch (error) {
  //   console.warn('GitHub OAuth not configured:', error);
  // }
}

// Get OAuth provider
export function getOAuthProvider(name: string): OAuthProvider | null {
  const factory = providers.get(name);
  if (!factory) {
    return null;
  }

  try {
    return factory();
  } catch (error) {
    console.error(`Failed to create ${name} OAuth provider:`, error);
    return null;
  }
}

// Get all available providers
export function getAvailableProviders(): string[] {
  return Array.from(providers.keys());
}

// Re-export utility functions
export { linkOAuthAccount, findUserByOAuthAccount };

// Initialize providers on module load
registerOAuthProviders();

