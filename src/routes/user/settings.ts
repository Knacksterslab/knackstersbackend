/**
 * Shared User Settings Routes
 * /api/user/settings/*
 *
 * Works for any authenticated role.
 * Handles account settings that aren't profile fields: password change, etc.
 */

import { Router, Response } from 'express';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import { requireAuth } from '../../middleware/auth';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();

router.use(requireAuth);

/**
 * PATCH /api/user/settings/password
 * Change the authenticated user's password.
 * Verifies the current password before updating.
 */
router.patch('/password', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    if (!userId) return ApiResponse.error(res, 'Unauthorized', 401);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ApiResponse.error(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      return ApiResponse.error(res, 'New password must be at least 8 characters', 400);
    }

    // Look up the user's email to verify via SuperTokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) return ApiResponse.error(res, 'User not found', 404);

    // Verify current password via SuperTokens sign-in
    const signInResult = await EmailPassword.signIn('public', user.email, currentPassword);
    if (signInResult.status !== 'OK') {
      return ApiResponse.error(res, 'Current password is incorrect', 400);
    }

    // Update password via SuperTokens
    const updateResult = await EmailPassword.updateEmailOrPassword({
      recipeUserId: signInResult.user.loginMethods[0].recipeUserId,
      password: newPassword,
    });

    if (updateResult.status !== 'OK') {
      return ApiResponse.error(res, 'Failed to update password', 500);
    }

    logger.info(`User ${userId} changed their password`);
    return ApiResponse.success(res, { message: 'Password changed successfully' });
  } catch (error: any) {
    logger.error('PATCH /api/user/settings/password failed', error);
    return ApiResponse.error(res, error.message || 'Failed to change password');
  }
});

export default router;
