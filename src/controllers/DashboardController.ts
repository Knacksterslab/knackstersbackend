/**
 * Dashboard Controller
 * Handles dashboard API requests
 */


import { Response } from 'express';
import { AuthRequest } from '../types';
import DashboardService from '../services/DashboardService';
import HoursBalanceService from '../services/HoursBalanceService';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class DashboardController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async getOverview(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const overview = await DashboardService.getDashboardOverview(userId);
      return ApiResponse.success(res, overview);
    } catch (error: any) {
      logger.error('getOverview failed', error);
      
      const userId = req.userId;
      if (error.message === 'User not found' && userId) {
        return ApiResponse.success(res, {
          user: { id: userId, email: '', role: 'CLIENT', fullName: 'New User', companyName: null, phone: null, avatarUrl: null },
          subscription: null,
          hoursBalance: null,
          recentTasks: [],
          notifications: [],
          accountManager: null,
          upcomingMeeting: null,
        });
      }

      return ApiResponse.error(res, error.message || 'Failed to fetch dashboard');
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const stats = await DashboardService.getDashboardStats(userId);
      return ApiResponse.success(res, stats);
    } catch (error: any) {
      logger.error('getStats failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch stats');
    }
  }

  static async getHoursBalance(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const balance = await HoursBalanceService.getCurrentBalance(userId);
      return ApiResponse.success(res, balance);
    } catch (error: any) {
      logger.error('getHoursBalance failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch hours balance');
    }
  }

  static async getRecentActivity(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const limit = parseInt(req.query.limit as string) || 10;
      // Use ActivityLogService instead since getRecentActivity doesn't exist in DashboardService
      const activities = await prisma.activityLog.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });
      return ApiResponse.success(res, activities);
    } catch (error: any) {
      logger.error('getRecentActivity failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch activities');
    }
  }
}

export default DashboardController;
