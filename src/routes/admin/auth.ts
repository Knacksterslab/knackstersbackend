/**
 * Admin Authentication Routes
 * /api/admin/auth/*
 * 
 * Admin authentication is handled through SuperTokens with ADMIN role.
 * Admins must:
 * 1. Have a user account with role: ADMIN in the database
 * 2. Sign in through SuperTokens (same as regular users)
 * 3. SuperTokens session will include their ADMIN role
 */

import { Router, Response } from 'express';
import { ApiResponse } from '../../utils/response';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { prisma } from '../../lib/prisma';

const router = Router();

/**
 * Check admin status
 * GET /api/admin/auth/status
 * Returns current admin user info if authenticated
 */
router.get('/status', requireAuth, requireRole(UserRole.ADMIN), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return ApiResponse.unauthorized(res, 'User ID not found in session');
    }

    // Get admin user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return ApiResponse.notFound(res, 'Admin user not found');
    }

    return ApiResponse.success(res, {
      user,
      authenticated: true,
    });
  } catch (error: any) {
    console.error('Admin status check failed:', error);
    return ApiResponse.error(res, 'Failed to verify admin status');
  }
});

/**
 * Note: Login is handled by SuperTokens /auth endpoints
 * Logout is handled by SuperTokens /auth/signout
 * 
 * To create an admin user:
 * 1. Insert user with role='ADMIN' in database
 * 2. User signs up/logs in through SuperTokens
 * 3. SuperTokens session will include ADMIN role
 */

export default router;
