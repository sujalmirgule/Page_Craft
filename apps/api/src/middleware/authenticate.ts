import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt';
import { User, IUserDocument } from '../models/User';
import type { ApiResponse, UserRole, PlanTier } from '@pagecraft/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: PlanTier;
  document: IUserDocument;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userId?: string;
    }
  }
}

/**
 * Authentication Middleware: Validates JWT Access Token from Header or Cookie
 */
export function authenticate(jwtSecret = process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_32_characters_minimum') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let token: string | undefined;

      // 1. Check Authorization Bearer Header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }

      // 2. Fallback to access_token cookie
      if (!token && req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
      }

      if (!token) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. No valid access token provided.',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        };
        res.status(401).json(response);
        return;
      }

      // 3. Verify Token
      const payload = verifyAccessToken(token, jwtSecret);

      // 4. Resolve User from Database
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Authenticated user account does not exist or is inactive.',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        };
        res.status(401).json(response);
        return;
      }

      // 5. Immediate Access-Token Revocation Verification (tokenVersion mismatch)
      if (
        payload.tokenVersion !== undefined &&
        user.tokenVersion !== undefined &&
        payload.tokenVersion !== user.tokenVersion
      ) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'REVOKED_TOKEN',
            message: 'Access token has been revoked due to session termination or logout.',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        };
        res.status(401).json(response);
        return;
      }

      // 6. Attach User to Request Context
      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        document: user,
      };
      req.userId = user._id.toString();

      next();
    } catch (err: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: err.name === 'TokenExpiredError' ? 'Access token has expired.' : 'Invalid access token signature.',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };
      res.status(401).json(response);
    }
  };
}
