import rateLimit from 'express-rate-limit';
import type { ApiResponse } from '@pagecraft/types';

/**
 * Strict rate limiting for credential login and registration attempts
 * 30 requests per 15 minutes per IP address
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  } as ApiResponse,
});
