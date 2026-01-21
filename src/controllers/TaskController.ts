/**
 * Task Controller
 * Handles task API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import TaskService from '../services/TaskService';
import { TaskStatus, PriorityLevel } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { Validators } from '../utils/validation';

export class TaskController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async getTasks(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const filters = {
        status: req.query.status as TaskStatus | undefined,
        projectId: req.query.projectId as string | undefined,
      };

      const tasks = await TaskService.getUserTasks(userId, filters);
      return ApiResponse.success(res, tasks);
    } catch (error: any) {
      logger.error('getTasks failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch tasks');
    }
  }

  static async getTask(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const task = await TaskService.getTaskById(req.params.id, userId);
      if (!task) return ApiResponse.notFound(res, 'Task');

      return ApiResponse.success(res, task);
    } catch (error: any) {
      logger.error('getTask failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch task');
    }
  }

  static async createTask(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { projectId, name, description, assignedToId, priority, dueDate, estimatedHours } = req.body;

      const validation = Validators.requireFields(req.body, ['projectId', 'name']);
      if (!validation.valid) {
        return ApiResponse.badRequest(res, `Missing fields: ${validation.missing.join(', ')}`);
      }

      const task = await TaskService.createTask({
        projectId,
        name,
        description,
        assignedToId,
        priority: priority as PriorityLevel,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours,
        createdById: userId,
      });

      return ApiResponse.success(res, task, 201);
    } catch (error: any) {
      logger.error('createTask failed', error);
      return ApiResponse.error(res, error.message || 'Failed to create task');
    }
  }

  static async updateTask(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const task = await TaskService.updateTask(req.params.id, req.body);
      return ApiResponse.success(res, task);
    } catch (error: any) {
      logger.error('updateTask failed', error);
      return ApiResponse.error(res, error.message || 'Failed to update task');
    }
  }

  static async assignTask(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { assignedToId } = req.body;
      if (!assignedToId) return ApiResponse.badRequest(res, 'assignedToId is required');

      const task = await TaskService.assignTask(req.params.id, assignedToId);
      return ApiResponse.success(res, task);
    } catch (error: any) {
      logger.error('assignTask failed', error);
      return ApiResponse.error(res, error.message || 'Failed to assign task');
    }
  }

  static async deleteTask(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      await TaskService.deleteTask(req.params.id);
      return ApiResponse.success(res, { message: 'Task deleted successfully' });
    } catch (error: any) {
      logger.error('deleteTask failed', error);
      return ApiResponse.error(res, error.message || 'Failed to delete task');
    }
  }

  static async getProjectTasks(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const tasks = await TaskService.getProjectTasks(
        req.params.projectId,
        req.query.status as TaskStatus | undefined
      );

      return ApiResponse.success(res, tasks);
    } catch (error: any) {
      logger.error('getProjectTasks failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch project tasks');
    }
  }

  static async getTaskStats(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const stats = await TaskService.getTaskStats(req.params.projectId);
      return ApiResponse.success(res, stats);
    } catch (error: any) {
      logger.error('getTaskStats failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch task stats');
    }
  }
}

export default TaskController;
