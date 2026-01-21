/**
 * Time Log Controller
 * Handles time tracking API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import TimeLogService from '../services/TimeLogService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class TimeLogController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async getTimeLogs(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { taskId, projectId, startDate, endDate } = req.query;
      
      const filters = {
        taskId: taskId as string | undefined,
        projectId: projectId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const timeLogs = await TimeLogService.getUserTimeLogs(userId, filters);
      return ApiResponse.success(res, timeLogs);
    } catch (error: any) {
      logger.error('getTimeLogs failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch time logs');
    }
  }

  static async getTimeLog(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const timeLog = await TimeLogService.getTimeLogById(req.params.id, userId);
      if (!timeLog) return ApiResponse.notFound(res, 'Time log');

      return ApiResponse.success(res, timeLog);
    } catch (error: any) {
      logger.error('getTimeLog failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch time log');
    }
  }

  static async createTimeLog(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { taskId, projectId, clientId, durationMinutes, startTime, description } = req.body;

      if (!taskId || !projectId || !clientId || !durationMinutes || !startTime) {
        return ApiResponse.badRequest(res, 'Missing required fields: taskId, projectId, clientId, durationMinutes, startTime');
      }

      const timeLog = await TimeLogService.logTime({
        taskId,
        projectId,
        clientId,
        userId,
        durationMinutes: parseInt(durationMinutes),
        startTime: new Date(startTime),
        description,
      });

      return ApiResponse.success(res, timeLog, 201);
    } catch (error: any) {
      logger.error('createTimeLog failed', error);
      return ApiResponse.error(res, error.message || 'Failed to create time log');
    }
  }

  static async updateTimeLog(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const timeLog = await TimeLogService.updateTimeLog(req.params.id, req.body);
      return ApiResponse.success(res, timeLog);
    } catch (error: any) {
      logger.error('updateTimeLog failed', error);
      return ApiResponse.error(res, error.message || 'Failed to update time log');
    }
  }

  static async deleteTimeLog(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      await TimeLogService.deleteTimeLog(req.params.id);
      return ApiResponse.success(res, { message: 'Time log deleted successfully' });
    } catch (error: any) {
      logger.error('deleteTimeLog failed', error);
      return ApiResponse.error(res, error.message || 'Failed to delete time log');
    }
  }
}

export default TimeLogController;
