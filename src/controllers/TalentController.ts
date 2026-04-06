/**
 * Talent Controller
 * Handles talent API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import TalentService from '../services/TalentService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export class TalentController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const dashboard = await TalentService.getDashboardOverview(userId);
      return ApiResponse.success(res, dashboard);
    } catch (error: any) {
      logger.error('getDashboard failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch dashboard');
    }
  }

  static async getEarnings(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { startDate, endDate } = req.query;
      const earnings = await TalentService.getEarnings(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      return ApiResponse.success(res, earnings);
    } catch (error: any) {
      logger.error('getEarnings failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch earnings');
    }
  }

  static async getTaskHistory(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const history = await TalentService.getTaskHistory(userId, limit);

      return ApiResponse.success(res, history);
    } catch (error: any) {
      logger.error('getTaskHistory failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch task history');
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          bio: true,
          skills: true,
          timezone: true,
          weeklyCapacityHours: true,
          portfolioUrl: true,
          linkedinUrl: true,
        },
      });

      if (!user) return ApiResponse.notFound(res, 'User');
      return ApiResponse.success(res, { profile: user });
    } catch (error: any) {
      logger.error('getProfile failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch profile');
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const {
        firstName,
        lastName,
        phone,
        bio,
        skills,
        timezone,
        weeklyCapacityHours,
        portfolioUrl,
        linkedinUrl,
      } = req.body;

      // Validate skills is an array if provided
      if (skills !== undefined && !Array.isArray(skills)) {
        return ApiResponse.badRequest(res, 'skills must be an array of strings');
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined && { firstName, fullName: `${firstName} ${lastName ?? ''}`.trim() }),
          ...(lastName !== undefined && { lastName, fullName: `${firstName ?? ''} ${lastName}`.trim() }),
          ...(phone !== undefined && { phone }),
          ...(bio !== undefined && { bio }),
          ...(skills !== undefined && { skills }),
          ...(timezone !== undefined && { timezone }),
          ...(weeklyCapacityHours !== undefined && { weeklyCapacityHours: parseInt(weeklyCapacityHours) || null }),
          ...(portfolioUrl !== undefined && { portfolioUrl }),
          ...(linkedinUrl !== undefined && { linkedinUrl }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          bio: true,
          skills: true,
          timezone: true,
          weeklyCapacityHours: true,
          portfolioUrl: true,
          linkedinUrl: true,
        },
      });

      return ApiResponse.success(res, { profile: updated, message: 'Profile updated successfully' });
    } catch (error: any) {
      logger.error('updateProfile failed', error);
      return ApiResponse.error(res, error.message || 'Failed to update profile');
    }
  }
}

export default TalentController;
