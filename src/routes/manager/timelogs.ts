/**
 * Manager Time Logs Routes
 * /api/manager/timelogs/*
 * Managers can log hours on behalf of talent and approve time logs
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
 * Log hours on behalf of talent for a task
 * Managers log hours after talent completes work
 */
router.post('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const { taskId, talentId, durationMinutes, startTime, description } = req.body;

    if (!taskId || !talentId || !durationMinutes || !startTime) {
      return ApiResponse.badRequest(res, 'taskId, talentId, durationMinutes, and startTime are required');
    }

    // Verify task belongs to manager's client
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

    if (task.project.client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only log hours for your managed clients');
    }

    // Verify talent exists
    const talent = await prisma.user.findUnique({
      where: { id: talentId },
      select: { id: true, role: true, fullName: true },
    });

    if (!talent || talent.role !== 'TALENT') {
      return ApiResponse.badRequest(res, 'Invalid talent user');
    }

    // Create time log
    const timeLog = await prisma.timeLog.create({
      data: {
        taskId,
        userId: talentId, // The talent who did the work
        projectId: task.projectId,
        clientId: task.project.clientId,
        startTime: new Date(startTime),
        durationMinutes,
        description: description || `Work on ${task.name}`,
        isApproved: true, // Manager-created logs are auto-approved
        approvedById: managerId,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        task: {
          select: {
            name: true,
            taskNumber: true,
          },
        },
        project: {
          select: {
            title: true,
          },
        },
      },
    });

    // Update task's logged minutes
    await prisma.task.update({
      where: { id: taskId },
      data: {
        loggedMinutes: {
          increment: durationMinutes,
        },
      },
    });

    // Update client's hours balance
    const hoursUsed = Number(durationMinutes) / 60;
    await prisma.hoursBalance.updateMany({
      where: {
        userId: task.project.clientId,
        periodEnd: {
          gte: new Date(),
        },
      },
      data: {
        hoursUsed: {
          increment: hoursUsed,
        },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: task.project.clientId,
        activityType: 'TASK_UPDATED',
        description: `${durationMinutes} minutes logged by ${talent.fullName} on "${task.name}"`,
        metadata: {
          taskId,
          talentId,
          managerId,
          durationMinutes,
        },
      },
    });

    logger.info(`Manager ${managerId} logged ${durationMinutes} minutes for talent ${talentId} on task ${taskId}`);

    return ApiResponse.success(res, {
      message: 'Hours logged successfully',
      timeLog,
    }, 201);
  } catch (error: any) {
    logger.error('logHours failed', error);
    return ApiResponse.error(res, error.message || 'Failed to log hours');
  }
});

/**
 * Get pending time logs for manager's clients (for approval)
 */
router.get('/pending', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    // Get all pending time logs for manager's clients
    const pendingLogs = await prisma.timeLog.findMany({
      where: {
        isApproved: false,
        client: {
          accountManagerId: managerId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            name: true,
            taskNumber: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return ApiResponse.success(res, pendingLogs);
  } catch (error: any) {
    logger.error('getPendingTimeLogs failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch pending time logs');
  }
});

/**
 * Approve a time log
 */
router.patch('/:id/approve', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const timeLogId = req.params.id;

    // Verify time log belongs to manager's client
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: timeLogId },
      include: {
        client: true,
        task: true,
      },
    });

    if (!timeLog) {
      return ApiResponse.notFound(res, 'Time log');
    }

    if (timeLog.client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only approve time logs for your managed clients');
    }

    // Approve the time log
    const approvedLog = await prisma.timeLog.update({
      where: { id: timeLogId },
      data: {
        isApproved: true,
        approvedById: managerId,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Notify talent
    await prisma.notification.create({
      data: {
        userId: timeLog.userId,
        type: 'INFO',
        title: 'Time Log Approved',
        message: `Your time log for "${timeLog.task.name}" (${timeLog.durationMinutes} minutes) has been approved`,
        actionUrl: '/talent-dashboard/timesheets',
        actionLabel: 'View Timesheets',
      },
    });

    logger.info(`Manager ${managerId} approved time log ${timeLogId}`);

    return ApiResponse.success(res, {
      message: 'Time log approved successfully',
      timeLog: approvedLog,
    });
  } catch (error: any) {
    logger.error('approveTimeLog failed', error);
    return ApiResponse.error(res, error.message || 'Failed to approve time log');
  }
});

/**
 * Reject a time log (request revision)
 */
router.patch('/:id/reject', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const timeLogId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return ApiResponse.badRequest(res, 'Rejection reason is required');
    }

    // Verify time log belongs to manager's client
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: timeLogId },
      include: {
        client: true,
        task: true,
        user: true,
      },
    });

    if (!timeLog) {
      return ApiResponse.notFound(res, 'Time log');
    }

    if (timeLog.client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only reject time logs for your managed clients');
    }

    // Delete the rejected time log
    await prisma.timeLog.delete({
      where: { id: timeLogId },
    });

    // Notify talent about rejection
    await prisma.notification.create({
      data: {
        userId: timeLog.userId,
        type: 'WARNING',
        title: 'Time Log Needs Revision',
        message: `Your time log for "${timeLog.task.name}" needs revision. Reason: ${reason}`,
        actionUrl: '/talent-dashboard/timesheets',
        actionLabel: 'Update Timesheet',
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: timeLog.clientId,
        activityType: 'TASK_UPDATED',
        description: `Time log for "${timeLog.task.name}" rejected by manager`,
        metadata: {
          timeLogId,
          talentId: timeLog.userId,
          managerId,
          reason,
        },
      },
    });

    logger.info(`Manager ${managerId} rejected time log ${timeLogId}`);

    return ApiResponse.success(res, {
      message: 'Time log rejected successfully',
      reason,
    });
  } catch (error: any) {
    logger.error('rejectTimeLog failed', error);
    return ApiResponse.error(res, error.message || 'Failed to reject time log');
  }
});

/**
 * Get approved time logs for manager's clients
 */
router.get('/approved', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const approvedLogs = await prisma.timeLog.findMany({
      where: {
        isApproved: true,
        approvedById: managerId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            name: true,
            taskNumber: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        approvedAt: 'desc',
      },
      take: 50, // Limit to recent 50
    });

    return ApiResponse.success(res, approvedLogs);
  } catch (error: any) {
    logger.error('getApprovedTimeLogs failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch approved time logs');
  }
});

/**
 * Get time logs for a specific client
 */
router.get('/client/:clientId', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const { clientId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify client is managed by this manager
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, accountManagerId: true },
    });

    if (!client || client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only view time logs for your managed clients');
    }

    const timeLogs = await prisma.timeLog.findMany({
      where: {
        clientId,
        ...(startDate && { startTime: { gte: new Date(startDate as string) } }),
        ...(endDate && { startTime: { lte: new Date(endDate as string) } }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            name: true,
            taskNumber: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return ApiResponse.success(res, timeLogs);
  } catch (error: any) {
    logger.error('getClientTimeLogs failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch time logs');
  }
});

export default router;
