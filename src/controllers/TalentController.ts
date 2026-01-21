/**
 * Talent Controller
 * Handles talent API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import TalentService from '../services/TalentService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

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
}

export default TalentController;
