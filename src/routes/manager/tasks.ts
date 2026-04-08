/**
 * Manager Tasks Routes
 * /api/manager/tasks/*
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
 * Assign a task to talent
 * Managers can assign tasks from their managed clients to any active talent
 */
router.patch('/:id/assign', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const { assignedToId } = req.body;
    if (!assignedToId) {
      return ApiResponse.badRequest(res, 'assignedToId is required');
    }

    const taskId = req.params.id;

    // Verify the task belongs to one of the manager's clients
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!task) {
      return ApiResponse.notFound(res, 'Task');
    }

    // Check if the task's client is managed by this manager
    if (task.project.client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only assign tasks for your managed clients');
    }

    // Verify the talent exists and is active
    const talent = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, role: true, status: true, fullName: true },
    });

    if (!talent || talent.role !== 'TALENT' || talent.status !== 'ACTIVE') {
      return ApiResponse.badRequest(res, 'Invalid talent or talent is not active');
    }

    // Assign the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId,
        assignedAt: new Date(),
        status: 'ACTIVE', // Move from PENDING to ACTIVE when assigned
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            title: true,
            projectNumber: true,
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

    // Create notification for talent
    await prisma.notification.create({
      data: {
        userId: assignedToId,
        type: 'INFO',
        title: 'New Task Assigned',
        message: `You have been assigned to task: ${task.name}`,
        relatedTaskId: taskId,
        actionUrl: `/talent-dashboard/tasks`,
        actionLabel: 'View Task',
      },
    });

    // Move parent project to IN_PROGRESS — clears the "Pending Review" banner on the client side
    await prisma.project.update({
      where: { id: task.projectId },
      data: { status: 'IN_PROGRESS' },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: task.project.clientId,
        activityType: 'TASK_CREATED',
        description: `Task "${task.name}" assigned to ${talent.fullName}`,
        metadata: {
          taskId,
          talentId: assignedToId,
          managerId,
        },
      },
    });

    logger.info(`Manager ${managerId} assigned task ${taskId} to talent ${assignedToId}`);

    return ApiResponse.success(res, {
      message: 'Task assigned successfully',
      task: updatedTask,
    });
  } catch (error: any) {
    logger.error('assignTask failed', error);
    return ApiResponse.error(res, error.message || 'Failed to assign task');
  }
});

/**
 * Update a task (for manager-specific updates)
 */
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const taskId = req.params.id;

    // Verify the task belongs to one of the manager's clients
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!task) {
      return ApiResponse.notFound(res, 'Task');
    }

    // Check if the task's client is managed by this manager
    if (task.project.client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only update tasks for your managed clients');
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: req.body,
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
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

    return ApiResponse.success(res, updatedTask);
  } catch (error: any) {
    logger.error('updateTask failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update task');
  }
});

export default router;
