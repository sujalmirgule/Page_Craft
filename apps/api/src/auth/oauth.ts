import crypto from 'crypto';
import type { IUserDocument } from '../models/User';

export interface OAuthUserProfile {
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Generate cryptographically secure random state parameter for CSRF mitigation
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Constant-time verification of OAuth state token
 */
export function verifyOAuthState(receivedState: string, expectedState: string): boolean {
  if (!receivedState || !expectedState) return false;
  if (receivedState.length !== expectedState.length) return false;
  return crypto.timingSafeEqual(Buffer.from(receivedState), Buffer.from(expectedState));
}

/**
 * Construct Google OAuth 2.0 Authorization URL
 */
export function buildGoogleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', params.scope || 'openid email profile');
  url.searchParams.set('state', params.state);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  return url.toString();
}

/**
 * Construct GitHub OAuth Authorization URL
 */
export function buildGitHubAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('scope', params.scope || 'user:email read:user');
  return url.toString();
}

/**
 * Link an OAuth provider identity to an existing or new user account
 */
export function linkOAuthIdentity(
  user: IUserDocument,
  provider: 'google' | 'github',
  providerId: string
): void {
  if (!user.oauthProviders) {
    user.oauthProviders = {};
  }

  if (provider === 'google') {
    user.oauthProviders.googleId = providerId;
  } else if (provider === 'github') {
    user.oauthProviders.githubId = providerId;
  }
}
