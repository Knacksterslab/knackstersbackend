/**
 * Manager Meetings Routes
 * /api/manager/meetings/*
 * Managers schedule and manage meetings with clients and talent
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole } from '../../config/supertokens';
import { ApiResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../types';
import { Response } from 'express';
import { MeetingType, MeetingStatus } from '@prisma/client';

const router = Router();

// All routes require authentication AND manager role
router.use(requireAuth);
router.use(requireRole(UserRole.MANAGER));

/**
 * Get all meetings for manager
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const { status, type } = req.query;

    const meetings = await prisma.meeting.findMany({
      where: {
        accountManagerId: managerId,
        ...(status && { status: status as MeetingStatus }),
        ...(type && { type: type as MeetingType }),
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return ApiResponse.success(res, meetings);
  } catch (error: any) {
    logger.error('getManagerMeetings failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch meetings');
  }
});

/**
 * Schedule a meeting with a client
 */
router.post('/schedule', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const {
      clientId,
      type,
      scheduledAt,
      durationMinutes,
      title,
      agenda,
      location,
      meetingLink,
    } = req.body;

    if (!clientId || !type || !scheduledAt || !durationMinutes) {
      return ApiResponse.badRequest(res, 'clientId, type, scheduledAt, and durationMinutes are required');
    }

    // Verify client is managed by this manager
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, accountManagerId: true, fullName: true, email: true },
    });

    if (!client) {
      return ApiResponse.notFound(res, 'Client');
    }

    if (client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only schedule meetings with your managed clients');
    }

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        clientId,
        accountManagerId: managerId,
        type: type as MeetingType,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: parseInt(durationMinutes),
        title: title || `${type} Meeting`,
        agenda,
        location,
        videoRoomUrl: meetingLink,
        status: 'SCHEDULED',
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
          },
        },
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Notify client
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: 'INFO',
        title: 'Meeting Scheduled',
        message: `Your ${type.toLowerCase()} meeting has been scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        actionUrl: `/dashboard/meetings/${meeting.id}`,
        actionLabel: 'View Meeting',
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: clientId,
        activityType: 'MEETING_SCHEDULED',
        description: `${type} meeting scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        metadata: {
          meetingId: meeting.id,
          managerId,
        },
      },
    });

    logger.info(`Manager ${managerId} scheduled meeting with client ${clientId}`);

    return ApiResponse.success(res, {
      message: 'Meeting scheduled successfully',
      meeting,
    }, 201);
  } catch (error: any) {
    logger.error('scheduleMeeting failed', error);
    return ApiResponse.error(res, error.message || 'Failed to schedule meeting');
  }
});

/**
 * Get meetings for a specific client
 */
router.get('/client/:clientId', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const { clientId } = req.params;

    // Verify client is managed by this manager
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, accountManagerId: true },
    });

    if (!client || client.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only view meetings for your managed clients');
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        clientId,
        accountManagerId: managerId,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return ApiResponse.success(res, meetings);
  } catch (error: any) {
    logger.error('getClientMeetings failed', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch meetings');
  }
});

/**
 * Update meeting
 */
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const meetingId = req.params.id;

    // Verify meeting belongs to manager
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, accountManagerId: true, clientId: true },
    });

    if (!meeting) {
      return ApiResponse.notFound(res, 'Meeting');
    }

    if (meeting.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only update your own meetings');
    }

    // Update meeting
    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: req.body,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    // Notify client if significant change
    if (req.body.scheduledAt || req.body.status === 'CANCELLED') {
      await prisma.notification.create({
        data: {
          userId: meeting.clientId,
          type: req.body.status === 'CANCELLED' ? 'WARNING' : 'INFO',
          title: req.body.status === 'CANCELLED' ? 'Meeting Cancelled' : 'Meeting Updated',
          message: req.body.status === 'CANCELLED'
            ? 'Your meeting has been cancelled'
            : 'Your meeting details have been updated',
          actionUrl: `/dashboard/meetings/${meeting.id}`,
          actionLabel: 'View Details',
        },
      });
    }

    return ApiResponse.success(res, updatedMeeting);
  } catch (error: any) {
    logger.error('updateMeeting failed', error);
    return ApiResponse.error(res, error.message || 'Failed to update meeting');
  }
});

/**
 * Complete a meeting and add notes
 */
router.post('/:id/complete', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const managerId = req.userId;
    if (!managerId) return ApiResponse.unauthorized(res);

    const meetingId = req.params.id;
    const { notes, actionItems } = req.body;

    // Verify meeting belongs to manager
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { client: true },
    });

    if (!meeting) {
      return ApiResponse.notFound(res, 'Meeting');
    }

    if (meeting.accountManagerId !== managerId) {
      return ApiResponse.forbidden(res, 'You can only complete your own meetings');
    }

    // Update meeting
    const completedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'COMPLETED',
        notes,
        actionItems,
        completedAt: new Date(),
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: meeting.clientId,
        activityType: 'MEETING_COMPLETED',
        description: `${meeting.type} meeting completed`,
        metadata: {
          meetingId,
          managerId,
          notes: notes || 'No notes',
        },
      },
    });

    logger.info(`Manager ${managerId} completed meeting ${meetingId}`);

    return ApiResponse.success(res, {
      message: 'Meeting marked as completed',
      meeting: completedMeeting,
    });
  } catch (error: any) {
    logger.error('completeMeeting failed', error);
    return ApiResponse.error(res, error.message || 'Failed to complete meeting');
  }
});

export default router;
