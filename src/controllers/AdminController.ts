/**
 * Admin Controller
 * Handles admin API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import AdminUserService from '../services/AdminUserService';
import ActivityLogService from '../services/ActivityLogService';
import { UserRole, UserStatus } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class AdminController {
  private getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  async getPlatformStats(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) return;

      const stats = await AdminUserService.getPlatformStats();
      return ApiResponse.success(res, stats);
    } catch (error: any) {
      logger.error('getPlatformStats failed', error);
      return ApiResponse.error(res, 'Failed to fetch platform statistics');
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) {
        return;
      }

      const { role, status, search, limit, offset } = req.query;
      const filters: any = {};
      if (role) filters.role = role as UserRole;
      if (status) filters.status = status as UserStatus;
      if (search) filters.search = search as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const result = await AdminUserService.getAllUsers(filters);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      logger.error('getUsers failed', error);
      return ApiResponse.error(res, 'Failed to fetch users');
    }
  }

  async getUserDetails(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) return;

      const user = await AdminUserService.getUserDetails(req.params.userId);
      if (!user) return ApiResponse.notFound(res, 'User');

      return ApiResponse.success(res, user);
    } catch (error: any) {
      logger.error('getUserDetails failed', error);
      return ApiResponse.error(res, 'Failed to fetch user details');
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) return;

      const user = await AdminUserService.updateUser(req.params.userId, req.body);
      return ApiResponse.success(res, user);
    } catch (error: any) {
      logger.error('updateUser failed', error);
      return ApiResponse.error(res, 'Failed to update user');
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) return;

      await AdminUserService.deleteUser(req.params.userId);
      return ApiResponse.success(res, { message: 'User deleted successfully' });
    } catch (error: any) {
      logger.error('deleteUser failed', error);
      return ApiResponse.error(res, 'Failed to delete user');
    }
  }

  async createUser(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) return;

      const { email, firstName, lastName, role, specializations, password } = req.body;

      // Validate required fields
      if (!email || !firstName || !lastName || !role || !password) {
        return ApiResponse.error(res, 'Missing required fields', 400);
      }

      // Validate password
      if (password.length < 8) {
        return ApiResponse.error(res, 'Password must be at least 8 characters', 400);
      }

      // Validate role
      if (!['ADMIN', 'MANAGER', 'TALENT'].includes(role)) {
        return ApiResponse.error(res, 'Invalid role. Only ADMIN, MANAGER, and TALENT users can be created.', 400);
      }

      const user = await AdminUserService.createUser({
        email,
        firstName,
        lastName,
        role,
        specializations,
        password,
      });

      return ApiResponse.success(res, {
        user,
        message: 'User created successfully. They can now log in with the provided credentials.',
      }, 201);
    } catch (error: any) {
      logger.error('createUser failed', error);
      return ApiResponse.error(res, error.message || 'Failed to create user');
    }
  }

  async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) return;

      const { role } = req.body;
      if (!role) {
        return ApiResponse.error(res, 'Role is required', 400);
      }

      const user = await AdminUserService.updateUserRole(req.params.userId, role as UserRole);
      return ApiResponse.success(res, user);
    } catch (error: any) {
      logger.error('updateUserRole failed', error);
      return ApiResponse.error(res, 'Failed to update user role');
    }
  }

  async toggleUserStatus(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) return;

      const { active } = req.body;
      if (typeof active !== 'boolean') {
        return ApiResponse.error(res, 'Active status is required', 400);
      }

      const user = await AdminUserService.toggleUserStatus(req.params.userId, active);
      return ApiResponse.success(res, user);
    } catch (error: any) {
      logger.error('toggleUserStatus failed', error);
      return ApiResponse.error(res, 'Failed to update user status');
    }
  }

  async getActivityLogs(req: AuthRequest, res: Response) {
    try {
      const adminId = this.getUserId(req, res);
      if (!adminId) return;

      const { userId, activityType, limit, offset } = req.query;
      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (activityType) filters.activityType = activityType as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      // Use getAllActivities instead of getActivityLogs
      const logs = await ActivityLogService.getAllActivities(filters);
      return ApiResponse.success(res, logs);
    } catch (error: any) {
      logger.error('getActivityLogs failed', error);
      return ApiResponse.error(res, 'Failed to fetch activity logs');
    }
  }
}

export default new AdminController();
