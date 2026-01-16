/**
 * User Preferences Controller
 * Handles user preferences including onboarding tips
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class UserPreferencesController {
  /**
   * Get user's dismissed tips
   */
  static async getDismissedTips(req: AuthRequest, res: Response) {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return ApiResponse.unauthorized(res);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          onboardingTips: true,
          isOnboardingComplete: true,
        },
      });

      if (!user) {
        return ApiResponse.notFound(res, 'User');
      }

      const dismissedTips = (user.onboardingTips as any) || {};

      return ApiResponse.success(res, {
        dismissedTips,
        isOnboardingComplete: user.isOnboardingComplete,
      });
    } catch (error: any) {
      logger.error('getDismissedTips failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch tips');
    }
  }

  /**
   * Dismiss a specific tip
   */
  static async dismissTip(req: AuthRequest, res: Response) {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return ApiResponse.unauthorized(res);
      }

      const { tipId } = req.body;

      if (!tipId || typeof tipId !== 'string') {
        return ApiResponse.badRequest(res, 'Invalid tip ID');
      }

      // Get current tips
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { onboardingTips: true },
      });

      if (!user) {
        return ApiResponse.notFound(res, 'User');
      }

      const dismissedTips = (user.onboardingTips as any) || {};
      dismissedTips[tipId] = {
        dismissed: true,
        dismissedAt: new Date().toISOString(),
      };

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingTips: dismissedTips,
        },
      });

      logger.info('Tip dismissed', { userId, tipId });

      return ApiResponse.success(res, {
        message: 'Tip dismissed successfully',
        tipId,
      });
    } catch (error: any) {
      logger.error('dismissTip failed', error);
      return ApiResponse.error(res, error.message || 'Failed to dismiss tip');
    }
  }

  /**
   * Mark onboarding as complete
   */
  static async completeOnboarding(req: AuthRequest, res: Response) {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return ApiResponse.unauthorized(res);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnboardingComplete: true,
        },
      });

      logger.info('Onboarding completed', { userId });

      return ApiResponse.success(res, {
        message: 'Onboarding completed successfully',
      });
    } catch (error: any) {
      logger.error('completeOnboarding failed', error);
      return ApiResponse.error(res, error.message || 'Failed to complete onboarding');
    }
  }

  /**
   * Reset all tips (for testing or user request)
   */
  static async resetTips(req: AuthRequest, res: Response) {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return ApiResponse.unauthorized(res);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingTips: {},
          isOnboardingComplete: false,
        },
      });

      logger.info('Tips reset', { userId });

      return ApiResponse.success(res, {
        message: 'Tips reset successfully',
      });
    } catch (error: any) {
      logger.error('resetTips failed', error);
      return ApiResponse.error(res, error.message || 'Failed to reset tips');
    }
  }
}

export default UserPreferencesController;
