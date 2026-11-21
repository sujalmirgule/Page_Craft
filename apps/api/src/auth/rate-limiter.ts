import rateLimit from 'express-rate-limit';
import type { ApiResponse } from '@pagecraft/types';

function createLimiter(windowMinutes: number, maxRequests: number, actionName: string) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many ${actionName} requests. Please try again after ${windowMinutes} minutes.`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    } as ApiResponse,
  });
}

/**
 * Strict rate limiting for credential login and registration attempts
 * 30 requests per 15 minutes per IP address
 */
export const authRateLimiter = createLimiter(15, 30, 'authentication');

/**
 * Rate limiting for token refresh requests
 * 60 requests per 15 minutes per IP address
 */
export const refreshRateLimiter = createLimiter(15, 60, 'token refresh');

/**
 * Rate limiting for OAuth handshakes and callbacks
 * 30 requests per 15 minutes per IP address
 */
export const oauthRateLimiter = createLimiter(15, 30, 'OAuth');

/**
 * Rate limiting for workspace invitations
 * 20 requests per 15 minutes per IP address
 */
export const inviteRateLimiter = createLimiter(15, 20, 'invitation');
