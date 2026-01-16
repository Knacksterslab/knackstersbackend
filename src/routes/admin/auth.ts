/**
 * Admin Authentication Routes
 * /api/admin/auth/*
 */

import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Admin login endpoint
 * POST /api/admin/auth/login
 */
router.post('/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return ApiResponse.badRequest(res, 'Password is required');
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      // In a real app, you'd create a proper session/JWT here
      // For now, we'll just return success
      return ApiResponse.success(res, {
        authenticated: true,
        message: 'Admin authentication successful',
      });
    } else {
      return ApiResponse.unauthorized(res, 'Invalid admin password');
    }
  } catch (error: any) {
    logger.error('Admin login failed', error);
    return ApiResponse.error(res, 'Authentication failed');
  }
});

/**
 * Admin logout endpoint
 * POST /api/admin/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  return ApiResponse.success(res, {
    message: 'Admin logged out successfully',
  });
});

export default router;
