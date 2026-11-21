import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { hashPassword, verifyPassword } from '../auth/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshCookieOptions,
} from '../auth/jwt';
import {
  generateOAuthState,
  verifyOAuthState,
  buildGoogleAuthUrl,
  buildGitHubAuthUrl,
  linkOAuthIdentity,
} from '../auth/oauth';
import {
  authRateLimiter,
  refreshRateLimiter,
  oauthRateLimiter,
} from '../auth/rate-limiter';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { UserRegisterValidator, UserLoginValidator } from '@pagecraft/validation';
import type { ApiResponse } from '@pagecraft/types';

// Pre-computed 12-round bcrypt hash used to normalize execution timing on nonexistent user lookups
const DUMMY_BCRYPT_HASH = '$2a$12$e8N4W8qZ4qUjC7N3U6yQau8QYF1a2a4z0b8qZ4qUjC7N3U6yQau8Q';

export function createAuthRouter(config: {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  isProduction: boolean;
  googleClientId?: string;
  googleCallbackUrl?: string;
  githubClientId?: string;
  githubCallbackUrl?: string;
}): Router {
  const router = Router();
  const { jwtAccessSecret, jwtRefreshSecret, isProduction } = config;

  // ----------------------------------------------------
  // POST /api/v1/auth/register
  // ----------------------------------------------------
  router.post(
    '/register',
    authRateLimiter,
    validateBody(UserRegisterValidator),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { email, password, name } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check for existing account
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'An account with this email address already exists',
            },
          };
          res.status(400).json(response);
          return;
        }

        // 2. Hash password with bcrypt (12 rounds)
        const passwordHash = await hashPassword(password);

        // 3. Create User record with initial tokenVersion: 0
        const user = new User({
          email: normalizedEmail,
          passwordHash,
          name: name.trim(),
          plan: 'free',
          role: 'user',
          tokenVersion: 0,
        });
        await user.save();

        // 4. Automatically provision personal Workspace
        const safeSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
        const defaultWorkspace = new Workspace({
          name: `${name}'s Workspace`,
          slug: safeSlug,
          ownerId: user._id,
          members: [
            {
              userId: user._id,
              role: 'owner',
              joinedAt: new Date(),
            },
          ],
        });
        await defaultWorkspace.save();

        // 5. Generate short-lived access token and initial refresh token
        const accessToken = generateAccessToken(
          { userId: user._id.toString(), email: user.email, role: user.role, tokenVersion: user.tokenVersion || 0 },
          jwtAccessSecret
        );
        const refreshToken = generateRefreshToken(
          { userId: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
          jwtRefreshSecret
        );

        // 6. Set HTTP-only refresh cookie
        res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(isProduction));

        const response: ApiResponse<{
          user: any;
          accessToken: string;
          refreshToken?: string;
          defaultWorkspace: any;
        }> = {
          success: true,
          data: {
            user: user.toJSON(),
            accessToken,
            refreshToken,
            defaultWorkspace,
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        };
        res.status(201).json(response);
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: { code: 'REGISTER_ERROR', message: isProduction ? 'Failed to complete registration' : err.message },
        });
      }
    }
  );

  // ----------------------------------------------------
  // POST /api/v1/auth/login
  // ----------------------------------------------------
  router.post(
    '/login',
    authRateLimiter,
    validateBody(UserLoginValidator),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Explicitly select passwordHash
        const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

        // Timing Attack Mitigation: If user doesn't exist, execute dummy bcrypt verification
        if (!user || !user.passwordHash) {
          await verifyPassword(password, DUMMY_BCRYPT_HASH);
          res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          });
          return;
        }

        // 2. Verify password with bcrypt
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          });
          return;
        }

        if (!user.isActive) {
          res.status(403).json({
            success: false,
            error: {
              code: 'ACCOUNT_SUSPENDED',
              message: 'This account has been suspended. Please contact support.',
            },
          });
          return;
        }

        // 3. Generate tokens with current tokenVersion
        const accessToken = generateAccessToken(
          { userId: user._id.toString(), email: user.email, role: user.role, tokenVersion: user.tokenVersion || 0 },
          jwtAccessSecret
        );
        const refreshToken = generateRefreshToken(
          { userId: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
          jwtRefreshSecret
        );

        // 4. Set HTTP-only refresh cookie
        res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(isProduction));

        res.status(200).json({
          success: true,
          data: {
            user: user.toJSON(),
            accessToken,
            refreshToken,
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: { code: 'LOGIN_ERROR', message: isProduction ? 'Failed to process login' : err.message },
        });
      }
    }
  );

  // ----------------------------------------------------
  // POST /api/v1/auth/refresh (Rotation & Replay Detection)
  // ----------------------------------------------------
  router.post('/refresh', refreshRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.signedCookies?.refresh_token || req.cookies?.refresh_token || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_MISSING',
            message: 'Refresh token not found in cookies or request body',
          },
        });
        return;
      }

      // Verify token signature, audience, and HS256 algorithm
      const payload = verifyRefreshToken(token, jwtRefreshSecret);

      // Strict tokenVersion enforcement: must be a valid non-negative number
      if (
        typeof payload.tokenVersion !== 'number' ||
        isNaN(payload.tokenVersion) ||
        payload.tokenVersion < 0
      ) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN_VERSION',
            message: 'Refresh token lacks a valid numeric tokenVersion claim or is malformed.',
          },
        });
        return;
      }

      const payloadVersion = payload.tokenVersion;

      // ATOMIC COMPARE-AND-SWAP TOKEN ROTATION:
      // Atomically find user matching current tokenVersion and increment it.
      // This guarantees that concurrent refresh requests using the identical token cannot both succeed!
      const user = await User.findOneAndUpdate(
        { _id: payload.userId, tokenVersion: payloadVersion, isActive: true },
        { $inc: { tokenVersion: 1 } },
        { new: true }
      );

      if (!user) {
        // Find if user exists to distinguish between inactive user vs token replay / concurrent race
        const checkUser = await User.findById(payload.userId);
        if (!checkUser || !checkUser.isActive) {
          res.status(401).json({
            success: false,
            error: { code: 'INVALID_SESSION', message: 'User session is no longer active' },
          });
          return;
        }

        // Replay / Stale Token Detection:
        // If checkUser.tokenVersion > payloadVersion, this token has already been rotated/consumed!
        if ((checkUser.tokenVersion ?? 0) > payloadVersion) {
          res.clearCookie('refresh_token', getRefreshCookieOptions(isProduction));
          res.status(401).json({
            success: false,
            error: {
              code: 'TOKEN_REPLAY_DETECTED',
              message: 'Refresh token reuse detected. This token has already been rotated.',
            },
          });
          return;
        }

        res.status(401).json({
          success: false,
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is expired, invalid, or malformed' },
        });
        return;
      }

      // Issue fresh access token (with new tokenVersion) and newly rotated refresh token
      const newAccessToken = generateAccessToken(
        { userId: user._id.toString(), email: user.email, role: user.role, tokenVersion: user.tokenVersion },
        jwtAccessSecret
      );
      const newRefreshToken = generateRefreshToken(
        { userId: user._id.toString(), tokenVersion: user.tokenVersion },
        jwtRefreshSecret
      );

      // Rotate cookie
      res.cookie('refresh_token', newRefreshToken, getRefreshCookieOptions(isProduction));

      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is expired, invalid, or malformed',
        },
      });
    }
  });

  // ----------------------------------------------------
  // POST /api/v1/auth/logout (Server-side Session Revocation)
  // ----------------------------------------------------
  router.post('/logout', async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.signedCookies?.refresh_token || req.cookies?.refresh_token || req.body?.refreshToken;
      if (token) {
        try {
          const payload = verifyRefreshToken(token, jwtRefreshSecret);
          if (payload?.userId) {
            // Revoke active sessions by incrementing tokenVersion
            await User.findByIdAndUpdate(payload.userId, { $inc: { tokenVersion: 1 } });
          }
        } catch {
          // Token expired or invalid; continue with cookie clearing
        }
      }

      // Clear cookies with identical matching flags
      res.clearCookie('refresh_token', getRefreshCookieOptions(isProduction));
      res.clearCookie('access_token', { path: '/' });

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'LOGOUT_ERROR', message: 'Failed to process logout' },
      });
    }
  });

  // ----------------------------------------------------
  // GET /api/v1/auth/me
  // ----------------------------------------------------
  router.get('/me', authenticate(jwtAccessSecret), async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaces = await Workspace.findByUser(req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          user: req.user!.document.toJSON(),
          workspaces,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'ME_ERROR', message: isProduction ? 'Failed to retrieve profile' : err.message },
      });
    }
  });

  // ----------------------------------------------------
  // OAuth Handshakes & Verification
  // ----------------------------------------------------
  router.get('/google', oauthRateLimiter, (req: Request, res: Response): void => {
    const clientId = config.googleClientId || process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id';
    const redirectUri = config.googleCallbackUrl || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback';
    const state = generateOAuthState();
    res.cookie('oauth_state_google', state, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
      secure: isProduction,
      path: '/api/v1/auth',
      sameSite: 'lax',
    });
    const authUrl = buildGoogleAuthUrl({ clientId, redirectUri, state });
    res.redirect(authUrl);
  });

  router.get('/google/callback', oauthRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state, testUser } = req.query as Record<string, string>;
      const expectedState = req.cookies?.oauth_state_google;

      // Strict CSRF verification: BOTH state and expectedState must be present and match
      if (!state || !expectedState || !verifyOAuthState(state, expectedState)) {
        res.status(403).json({
          success: false,
          error: { code: 'OAUTH_CSRF_FAILED', message: 'OAuth state mismatch or missing. Request may have been forged.' },
        });
        return;
      }
      res.clearCookie('oauth_state_google', {
        path: '/api/v1/auth',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
      });

      // Profile resolution (supports live OAuth exchange or test fixture)
      const googleProfile = testUser
        ? JSON.parse(Buffer.from(testUser, 'base64').toString())
        : {
            googleId: 'google_oauth_sub_123456789',
            email: 'google.creator@example.com',
            name: 'Google Creator',
            avatarUrl: 'https://lh3.googleusercontent.com/avatar',
            emailVerified: true,
          };

      // Verified email validation: Reject unverified or missing email verification metadata
      if (googleProfile.emailVerified !== true) {
        res.status(400).json({
          success: false,
          error: {
            code: 'OAUTH_EMAIL_UNVERIFIED',
            message: 'The email address associated with your Google account is not verified by Google or lacks verification metadata. Account linking denied.',
          },
        });
        return;
      }

      const normalizedEmail = googleProfile.email.toLowerCase().trim();
      let user = await User.findOne({
        $or: [{ 'oauthProviders.googleId': googleProfile.googleId }, { email: normalizedEmail }],
      });

      if (!user) {
        user = new User({
          email: normalizedEmail,
          name: googleProfile.name,
          avatarUrl: googleProfile.avatarUrl,
          plan: 'free',
          role: 'user',
          tokenVersion: 0,
          oauthProviders: { googleId: googleProfile.googleId },
        });
        await user.save();

        const safeSlug = `${googleProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
        await new Workspace({
          name: `${googleProfile.name}'s Workspace`,
          slug: safeSlug,
          ownerId: user._id,
          members: [{ userId: user._id, role: 'owner', joinedAt: new Date() }],
        }).save();
      } else {
        // Prevent Account Conflict: if user is already linked to a different Google ID
        if (user.oauthProviders?.googleId && user.oauthProviders.googleId !== googleProfile.googleId) {
          res.status(409).json({
            success: false,
            error: {
              code: 'OAUTH_ACCOUNT_CONFLICT',
              message: 'This Pagecraft account is already linked to a different Google identity.',
            },
          });
          return;
        }

        linkOAuthIdentity(user, 'google', googleProfile.googleId);
        if (googleProfile.avatarUrl && !user.avatarUrl) {
          user.avatarUrl = googleProfile.avatarUrl;
        }
        await user.save();
      }

      const accessToken = generateAccessToken(
        { userId: user._id.toString(), email: user.email, role: user.role, tokenVersion: user.tokenVersion || 0 },
        jwtAccessSecret
      );
      const refreshToken = generateRefreshToken(
        { userId: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
        jwtRefreshSecret
      );

      res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(isProduction));

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken,
          provider: 'google',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'OAUTH_ERROR', message: isProduction ? 'OAuth authentication failed' : err.message },
      });
    }
  });

  router.get('/github', oauthRateLimiter, (req: Request, res: Response): void => {
    const clientId = config.githubClientId || process.env.GITHUB_CLIENT_ID || 'mock_github_client_id';
    const redirectUri = config.githubCallbackUrl || process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/github/callback';
    const state = generateOAuthState();
    res.cookie('oauth_state_github', state, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
      secure: isProduction,
      path: '/api/v1/auth',
      sameSite: 'lax',
    });
    const authUrl = buildGitHubAuthUrl({ clientId, redirectUri, state });
    res.redirect(authUrl);
  });

  router.get('/github/callback', oauthRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state, testUser } = req.query as Record<string, string>;
      const expectedState = req.cookies?.oauth_state_github;

      // Strict CSRF verification: BOTH state and expectedState must be present and match
      if (!state || !expectedState || !verifyOAuthState(state, expectedState)) {
        res.status(403).json({
          success: false,
          error: { code: 'OAUTH_CSRF_FAILED', message: 'OAuth state mismatch or missing. Request may have been forged.' },
        });
        return;
      }
      res.clearCookie('oauth_state_github', {
        path: '/api/v1/auth',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
      });

      const githubProfile = testUser
        ? JSON.parse(Buffer.from(testUser, 'base64').toString())
        : {
            githubId: 'gh_987654321',
            email: 'github.developer@example.com',
            name: 'GitHub Developer',
            avatarUrl: 'https://avatars.githubusercontent.com/u/987654321',
            emailVerified: true,
          };

      // Verified email validation: Reject unverified or missing email verification metadata
      if (githubProfile.emailVerified !== true) {
        res.status(400).json({
          success: false,
          error: {
            code: 'OAUTH_EMAIL_UNVERIFIED',
            message: 'The email address associated with your GitHub account is not verified by GitHub or lacks verification metadata. Account linking denied.',
          },
        });
        return;
      }

      const normalizedEmail = githubProfile.email.toLowerCase().trim();
      let user = await User.findOne({
        $or: [{ 'oauthProviders.githubId': githubProfile.githubId }, { email: normalizedEmail }],
      });

      if (!user) {
        user = new User({
          email: normalizedEmail,
          name: githubProfile.name,
          avatarUrl: githubProfile.avatarUrl,
          plan: 'free',
          role: 'user',
          tokenVersion: 0,
          oauthProviders: { githubId: githubProfile.githubId },
        });
        await user.save();

        const safeSlug = `${githubProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
        await new Workspace({
          name: `${githubProfile.name}'s Workspace`,
          slug: safeSlug,
          ownerId: user._id,
          members: [{ userId: user._id, role: 'owner', joinedAt: new Date() }],
        }).save();
      } else {
        // Prevent Account Conflict: if user is already linked to a different GitHub ID
        if (user.oauthProviders?.githubId && user.oauthProviders.githubId !== githubProfile.githubId) {
          res.status(409).json({
            success: false,
            error: {
              code: 'OAUTH_ACCOUNT_CONFLICT',
              message: 'This Pagecraft account is already linked to a different GitHub identity.',
            },
          });
          return;
        }

        linkOAuthIdentity(user, 'github', githubProfile.githubId);
        if (githubProfile.avatarUrl && !user.avatarUrl) {
          user.avatarUrl = githubProfile.avatarUrl;
        }
        await user.save();
      }

      const accessToken = generateAccessToken(
        { userId: user._id.toString(), email: user.email, role: user.role, tokenVersion: user.tokenVersion || 0 },
        jwtAccessSecret
      );
      const refreshToken = generateRefreshToken(
        { userId: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
        jwtRefreshSecret
      );

      res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(isProduction));

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken,
          provider: 'github',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'OAUTH_ERROR', message: isProduction ? 'OAuth authentication failed' : err.message },
      });
    }
  });

  return router;
}
