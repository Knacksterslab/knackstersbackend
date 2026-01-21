/**
 * Project Controller
 * Handles project API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import ProjectService from '../services/ProjectService';
import { ProjectStatus } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { Validators } from '../utils/validation';

export class ProjectController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async getProjects(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const status = req.query.status as ProjectStatus | undefined;
      const projects = await ProjectService.getClientProjects(userId, status);
      return ApiResponse.success(res, projects);
    } catch (error: any) {
      logger.error('getProjects failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch projects');
    }
  }

  static async getProject(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const project = await ProjectService.getProjectById(req.params.id, userId);
      if (!project) return ApiResponse.notFound(res, 'Project');

      return ApiResponse.success(res, project);
    } catch (error: any) {
      logger.error('getProject failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch project');
    }
  }

  static async createProject(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { title, description, estimatedHours, dueDate } = req.body;

      const validation = Validators.requireFields(req.body, ['title']);
      if (!validation.valid) {
        return ApiResponse.badRequest(res, `Missing fields: ${validation.missing.join(', ')}`);
      }

      const project = await ProjectService.createProject({
        clientId: userId,
        title,
        description,
        estimatedHours,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      return ApiResponse.success(res, project, 201);
    } catch (error: any) {
      logger.error('createProject failed', error);
      return ApiResponse.error(res, error.message || 'Failed to create project');
    }
  }

  static async updateProject(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const project = await ProjectService.updateProject(req.params.id, req.body);
      return ApiResponse.success(res, project);
    } catch (error: any) {
      logger.error('updateProject failed', error);
      return ApiResponse.error(res, error.message || 'Failed to update project');
    }
  }

  static async deleteProject(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      await ProjectService.deleteProject(req.params.id);
      return ApiResponse.success(res, { message: 'Project deleted successfully' });
    } catch (error: any) {
      logger.error('deleteProject failed', error);
      return ApiResponse.error(res, error.message || 'Failed to delete project');
    }
  }

  static async getProjectStats(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const stats = await ProjectService.getProjectStats(req.params.id);
      return ApiResponse.success(res, stats);
    } catch (error: any) {
      logger.error('getProjectStats failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch project stats');
    }
  }
}

export default ProjectController;
