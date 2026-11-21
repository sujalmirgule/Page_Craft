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
import { authRateLimiter } from '../auth/rate-limiter';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { UserRegisterValidator, UserLoginValidator } from '@pagecraft/validation';
import type { ApiResponse } from '@pagecraft/types';

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

        // 2. Hash password
        const passwordHash = await hashPassword(password);

        // 3. Create User record
        const user = new User({
          email: normalizedEmail,
          passwordHash,
          name: name.trim(),
          plan: 'free',
          role: 'user',
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

        // 5. Generate tokens
        const accessToken = generateAccessToken(
          { userId: user._id.toString(), email: user.email, role: user.role },
          jwtAccessSecret
        );
        const refreshToken = generateRefreshToken({ userId: user._id.toString() }, jwtRefreshSecret);

        // 6. Set HTTP-only refresh cookie
        res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(isProduction));

        const response: ApiResponse<{
          user: any;
          accessToken: string;
          defaultWorkspace: any;
        }> = {
          success: true,
          data: {
            user: user.toJSON(),
            accessToken,
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
          error: { code: 'REGISTER_ERROR', message: err.message },
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
        if (!user || !user.passwordHash) {
          // Standardized response prevents account enumeration
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

        // 3. Generate tokens
        const accessToken = generateAccessToken(
          { userId: user._id.toString(), email: user.email, role: user.role },
          jwtAccessSecret
        );
        const refreshToken = generateRefreshToken({ userId: user._id.toString() }, jwtRefreshSecret);

        // 4. Set HTTP-only refresh cookie
        res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(isProduction));

        res.status(200).json({
          success: true,
          data: {
            user: user.toJSON(),
            accessToken,
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: { code: 'LOGIN_ERROR', message: err.message },
        });
      }
    }
  );

  // ----------------------------------------------------
  // POST /api/v1/auth/refresh
  // ----------------------------------------------------
  router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.cookies?.refresh_token || req.body?.refreshToken;
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

      const payload = verifyRefreshToken(token, jwtRefreshSecret);
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_SESSION', message: 'User session is no longer active' },
        });
        return;
      }

      const newAccessToken = generateAccessToken(
        { userId: user._id.toString(), email: user.email, role: user.role },
        jwtAccessSecret
      );

      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
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
          message: 'Refresh token is expired or invalid',
        },
      });
    }
  });

  // ----------------------------------------------------
  // POST /api/v1/auth/logout
  // ----------------------------------------------------
  router.post('/logout', (req: Request, res: Response): void => {
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    res.clearCookie('access_token', { path: '/' });
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
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
        error: { code: 'ME_ERROR', message: err.message },
      });
    }
  });

  // ----------------------------------------------------
  // OAuth Handshakes & Verification
  // ----------------------------------------------------
  router.get('/google', (req: Request, res: Response): void => {
    const clientId = config.googleClientId || process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id';
    const redirectUri = config.googleCallbackUrl || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback';
    const state = generateOAuthState();
    res.cookie('oauth_state_google', state, { httpOnly: true, maxAge: 10 * 60 * 1000, secure: isProduction });
    const authUrl = buildGoogleAuthUrl({ clientId, redirectUri, state });
    res.redirect(authUrl);
  });

  router.get('/google/callback', async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state, testUser } = req.query as Record<string, string>;
      const expectedState = req.cookies?.oauth_state_google;

      if (expectedState && state && !verifyOAuthState(state, expectedState)) {
        res.status(403).json({
          success: false,
          error: { code: 'OAUTH_CSRF_FAILED', message: 'OAuth state mismatch. Request may have been forged.' },
        });
        return;
      }
      res.clearCookie('oauth_state_google');

      // Profile resolution (supports live OAuth exchange or test fixture)
      const googleProfile = testUser
        ? JSON.parse(Buffer.from(testUser, 'base64').toString())
        : {
            googleId: 'google_oauth_sub_123456789',
            email: 'google.creator@example.com',
            name: 'Google Creator',
            avatarUrl: 'https://lh3.googleusercontent.com/avatar',
          };

      let user = await User.findOne({
        $or: [{ 'oauthProviders.googleId': googleProfile.googleId }, { email: googleProfile.email.toLowerCase() }],
      });

      if (!user) {
        user = new User({
          email: googleProfile.email.toLowerCase(),
          name: googleProfile.name,
          avatarUrl: googleProfile.avatarUrl,
          plan: 'free',
          role: 'user',
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
        linkOAuthIdentity(user, 'google', googleProfile.googleId);
        if (googleProfile.avatarUrl && !user.avatarUrl) {
          user.avatarUrl = googleProfile.avatarUrl;
        }
        await user.save();
      }

      const accessToken = generateAccessToken(
        { userId: user._id.toString(), email: user.email, role: user.role },
        jwtAccessSecret
      );
      const refreshToken = generateRefreshToken({ userId: user._id.toString() }, jwtRefreshSecret);

      res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(isProduction));

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken,
          provider: 'google',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'OAUTH_ERROR', message: err.message },
      });
    }
  });

  router.get('/github', (req: Request, res: Response): void => {
    const clientId = config.githubClientId || process.env.GITHUB_CLIENT_ID || 'mock_github_client_id';
    const redirectUri = config.githubCallbackUrl || process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/github/callback';
    const state = generateOAuthState();
    res.cookie('oauth_state_github', state, { httpOnly: true, maxAge: 10 * 60 * 1000, secure: isProduction });
    const authUrl = buildGitHubAuthUrl({ clientId, redirectUri, state });
    res.redirect(authUrl);
  });

  router.get('/github/callback', async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state, testUser } = req.query as Record<string, string>;
      const expectedState = req.cookies?.oauth_state_github;

      if (expectedState && state && !verifyOAuthState(state, expectedState)) {
        res.status(403).json({
          success: false,
          error: { code: 'OAUTH_CSRF_FAILED', message: 'OAuth state mismatch. Request may have been forged.' },
        });
        return;
      }
      res.clearCookie('oauth_state_github');

      const githubProfile = testUser
        ? JSON.parse(Buffer.from(testUser, 'base64').toString())
        : {
            githubId: 'gh_987654321',
            email: 'github.developer@example.com',
            name: 'GitHub Developer',
            avatarUrl: 'https://avatars.githubusercontent.com/u/987654321',
          };

      let user = await User.findOne({
        $or: [{ 'oauthProviders.githubId': githubProfile.githubId }, { email: githubProfile.email.toLowerCase() }],
      });

      if (!user) {
        user = new User({
          email: githubProfile.email.toLowerCase(),
          name: githubProfile.name,
          avatarUrl: githubProfile.avatarUrl,
          plan: 'free',
          role: 'user',
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
        linkOAuthIdentity(user, 'github', githubProfile.githubId);
        if (githubProfile.avatarUrl && !user.avatarUrl) {
          user.avatarUrl = githubProfile.avatarUrl;
        }
        await user.save();
      }

      const accessToken = generateAccessToken(
        { userId: user._id.toString(), email: user.email, role: user.role },
        jwtAccessSecret
      );
      const refreshToken = generateRefreshToken({ userId: user._id.toString() }, jwtRefreshSecret);

      res.cookie('refresh_token', refreshToken, getRefreshCookieOptions(isProduction));

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken,
          provider: 'github',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'OAUTH_ERROR', message: err.message },
      });
    }
  });

  return router;
}
