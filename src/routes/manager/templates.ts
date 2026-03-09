/**
 * Manager Task Template Routes
 * /api/manager/templates/*
 * Managers can create, manage, and apply task templates
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../types';
import { Response } from 'express';

const router = Router();

// All routes require authentication AND manager role
router.use(requireAuth);
router.use(requireRole(UserRole.MANAGER));

/**
 * Get all templates (manager's own + public templates)
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const templates = await prisma.taskTemplate.findMany({
      where: {
        OR: [
          { createdById: managerId }, // Manager's own templates
          { isPublic: true }, // Public templates
        ],
      },
      include: {
        tasks: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ApiResponse.success(res, templates);
  } catch (error: any) {
    logger.error('getTemplates failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch templates');
  }
});

/**
 * Get a single template by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const template = await prisma.taskTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!template) {
      return ApiResponse.notFound(res, 'Template');
    }

    // Check access: must be creator or template must be public
    if (template.createdById !== managerId && !template.isPublic) {
      return ApiResponse.forbidden(res, 'You do not have access to this template');
    }

    return ApiResponse.success(res, template);
  } catch (error: any) {
    logger.error('getTemplate failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch template');
  }
});

/**
 * Create a new template
 */
router.post('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const { name, description, category, isPublic, tasks } = req.body;

    if (!name || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return ApiResponse.badRequest(res, 'name and tasks array are required');
    }

    // Create template with tasks
    const template = await prisma.taskTemplate.create({
      data: {
        name,
        description,
        category,
        isPublic: isPublic || false,
        createdById: managerId,
        tasks: {
          create: tasks.map((task: any, index: number) => ({
            name: task.name,
            description: task.description,
            priority: task.priority || 'MEDIUM',
            estimatedMinutes: task.estimatedMinutes || 60,
            orderIndex: index,
          })),
        },
      },
      include: {
        tasks: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    logger.info(`Manager ${managerId} created template ${template.id}`);

    return ApiResponse.success(res, {
      message: 'Template created successfully',
      template,
    }, 201);
  } catch (error: any) {
    logger.error('createTemplate failed', error);
    return ApiResponse.error(res, error.message || 'Failed to create template');
  }
});

/**
 * Update a template
 */
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const templateId = req.params.id;

    // Verify template belongs to manager
    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, createdById: true },
    });

    if (!template) {
      return ApiResponse.notFound(res, 'Template');
    }

    if (template.createdById !== managerId) {
      return ApiResponse.forbidden(res, 'You can only update your own templates');
    }

    const { name, description, category, isPublic } = req.body;

    // Update template (tasks updated separately if needed)
    const updatedTemplate = await prisma.taskTemplate.update({
      where: { id: templateId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        tasks: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return ApiResponse.success(res, updatedTemplate);
  } catch (error: any) {
    logger.error('updateTemplate failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update template');
  }
});

/**
 * Delete a template
 */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const templateId = req.params.id;

    // Verify template belongs to manager
    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, createdById: true },
    });

    if (!template) {
      return ApiResponse.notFound(res, 'Template');
    }

    if (template.createdById !== managerId) {
      return ApiResponse.forbidden(res, 'You can only delete your own templates');
    }

    await prisma.taskTemplate.delete({
      where: { id: templateId },
    });

    logger.info(`Manager ${managerId} deleted template ${templateId}`);

    return ApiResponse.success(res, { message: 'Template deleted successfully' });
  } catch (error: any) {
    logger.error('deleteTemplate failed', error);
    return ApiResponse.error(res, error.message || 'Failed to delete template');
  }
});

/**
 * Apply a template to a project (create tasks from template)
 */
router.post('/:id/apply', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const templateId = req.params.id;
    const { projectId } = req.body;

    if (!projectId) {
      return ApiResponse.badRequest(res, 'projectId is required');
    }

    // Verify template exists and manager has access
    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
      include: {
        tasks: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!template) {
      return ApiResponse.notFound(res, 'Template');
    }

    if (template.createdById !== managerId && !template.isPublic) {
      return ApiResponse.forbidden(res, 'You do not have access to this template');
    }

    // Verify project exists and manager has authority
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: {
            id: true,
            accountManagerId: true,
          },
        },
      },
    });

    if (!project) {
      return ApiResponse.notFound(res, 'Project');
    }

    if (project.client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only create tasks for your managed clients');
    }

    // Get the next task number for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });

    let nextTaskNumber = 1;
    if (lastTask && lastTask.taskNumber) {
      const match = lastTask.taskNumber.match(/T-(\d+)/);
      if (match) {
        nextTaskNumber = parseInt(match[1]) + 1;
      }
    }

    // Create tasks from template
    const createdTasks = await Promise.all(
      template.tasks.map(async (templateTask, index) => {
        const taskNumber = `T-${String(nextTaskNumber + index).padStart(3, '0')}`;
        
        return prisma.task.create({
          data: {
            projectId,
            taskNumber,
            name: templateTask.name,
            description: templateTask.description,
            priority: templateTask.priority,
            estimatedMinutes: templateTask.estimatedMinutes,
            status: 'PENDING',
            createdById: managerId,
          },
          include: {
            project: {
              select: {
                title: true,
                client: {
                  select: {
                    fullName: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        });
      })
    );

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: project.clientId,
        activityType: 'TASK_CREATED',
        description: `${createdTasks.length} tasks created from template "${template.name}"`,
        metadata: {
          projectId,
          templateId,
          managerId,
          taskCount: createdTasks.length,
        },
      },
    });

    logger.info(`Manager ${managerId} applied template ${templateId} to project ${projectId}, creating ${createdTasks.length} tasks`);

    return ApiResponse.success(res, {
      message: `${createdTasks.length} tasks created successfully`,
      tasks: createdTasks,
    }, 201);
  } catch (error: any) {
    logger.error('applyTemplate failed', error);
    return ApiResponse.error(res, error.message || 'Failed to apply template');
  }
});

export default router;
