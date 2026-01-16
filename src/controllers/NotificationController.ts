/**
 * Notification Controller
 * Handles notification API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import NotificationService from '../services/NotificationService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class NotificationController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.session?.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = await NotificationService.getUserNotifications(userId, limit, unreadOnly);
      return ApiResponse.success(res, notifications);
    } catch (error: any) {
      logger.error('getNotifications failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch notifications');
    }
  }

  static async getUnreadNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const notifications = await NotificationService.getUserNotifications(userId, 20, true);
      return ApiResponse.success(res, notifications);
    } catch (error: any) {
      logger.error('getUnreadNotifications failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch notifications');
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const notification = await NotificationService.markAsRead(req.params.id);
      return ApiResponse.success(res, notification);
    } catch (error: any) {
      logger.error('markAsRead failed', error);
      return ApiResponse.error(res, error.message || 'Failed to mark notification as read');
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      await NotificationService.markAllAsRead(userId);
      return ApiResponse.success(res, { message: 'All notifications marked as read' });
    } catch (error: any) {
      logger.error('markAllAsRead failed', error);
      return ApiResponse.error(res, error.message || 'Failed to mark all as read');
    }
  }

  static async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      await NotificationService.deleteNotification(req.params.id);
      return ApiResponse.success(res, { message: 'Notification deleted' });
    } catch (error: any) {
      logger.error('deleteNotification failed', error);
      return ApiResponse.error(res, error.message || 'Failed to delete notification');
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const count = await NotificationService.getUnreadCount(userId);
      return ApiResponse.success(res, { count });
    } catch (error: any) {
      logger.error('getUnreadCount failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch unread count');
    }
  }
}

export default NotificationController;
