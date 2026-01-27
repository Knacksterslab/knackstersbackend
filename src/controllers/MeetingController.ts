/**
 * Meeting Controller
 * Handles meeting API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import MeetingService from '../services/MeetingService';
import { MeetingType, MeetingStatus } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { Validators } from '../utils/validation';

export class MeetingController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async getMeetings(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) return ApiResponse.unauthorized(res);

      const status = req.query.status as MeetingStatus | undefined;
      const meetings = await MeetingService.getUserMeetings(userId, status);
      return ApiResponse.success(res, meetings);
    } catch (error: any) {
      logger.error('getMeetings failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch meetings');
    }
  }

  static async getMeeting(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) return ApiResponse.unauthorized(res);

      const meeting = await MeetingService.getMeetingById(req.params.id, userId);
      if (!meeting) return ApiResponse.notFound(res, 'Meeting');

      return ApiResponse.success(res, meeting);
    } catch (error: any) {
      logger.error('getMeeting failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch meeting');
    }
  }

  static async scheduleMeeting(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { accountManagerId, meetingType, scheduledAt, durationMinutes, agenda, location, meetingLink } = req.body;

      const validation = Validators.requireFields(req.body, ['accountManagerId', 'meetingType', 'scheduledAt', 'durationMinutes']);
      if (!validation.valid) {
        return ApiResponse.badRequest(res, `Missing fields: ${validation.missing.join(', ')}`);
      }

      const meeting = await MeetingService.scheduleMeeting({
        clientId: userId,
        accountManagerId,
        meetingType: meetingType as MeetingType,
        scheduledAt: new Date(scheduledAt),
        durationMinutes,
        agenda,
        location,
        meetingLink,
      });

      return ApiResponse.success(res, meeting, 201);
    } catch (error: any) {
      logger.error('scheduleMeeting failed', error);
      return ApiResponse.error(res, error.message || 'Failed to schedule meeting');
    }
  }

  static async saveCalcomBooking(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { bookingId, scheduledAt, endTime, durationMinutes, videoCallUrl, title, description } = req.body;

      const validation = Validators.requireFields(req.body, ['bookingId', 'scheduledAt']);
      if (!validation.valid) {
        return ApiResponse.badRequest(res, `Missing fields: ${validation.missing.join(', ')}`);
      }

      // Calculate duration if not provided
      let duration = durationMinutes;
      if (!duration && scheduledAt && endTime) {
        const start = new Date(scheduledAt);
        const end = new Date(endTime);
        duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
      if (!duration) duration = 30; // Default to 30 minutes

      const meeting = await MeetingService.saveCalcomBooking({
        clientId: userId,
        bookingId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: duration,
        videoCallUrl,
        title,
        description,
      });

      return ApiResponse.success(res, meeting, 201);
    } catch (error: any) {
      logger.error('saveCalcomBooking failed', error);
      return ApiResponse.error(res, error.message || 'Failed to save Cal.com booking');
    }
  }

  static async rescheduleMeeting(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { newScheduledAt, reason } = req.body;
      if (!newScheduledAt) return ApiResponse.badRequest(res, 'newScheduledAt is required');

      const meeting = await MeetingService.rescheduleMeeting(req.params.id, new Date(newScheduledAt), reason);
      return ApiResponse.success(res, meeting);
    } catch (error: any) {
      logger.error('rescheduleMeeting failed', error);
      return ApiResponse.error(res, error.message || 'Failed to reschedule meeting');
    }
  }

  static async cancelMeeting(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { reason } = req.body;
      const meeting = await MeetingService.cancelMeeting(req.params.id, reason);
      return ApiResponse.success(res, meeting);
    } catch (error: any) {
      logger.error('cancelMeeting failed', error);
      return ApiResponse.error(res, error.message || 'Failed to cancel meeting');
    }
  }

  static async completeMeeting(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { notes } = req.body;
      const meeting = await MeetingService.completeMeeting(req.params.id, notes);
      return ApiResponse.success(res, meeting);
    } catch (error: any) {
      logger.error('completeMeeting failed', error);
      return ApiResponse.error(res, error.message || 'Failed to complete meeting');
    }
  }

  static async getCalendarView(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { month, year } = req.query;
      if (!month || !year) return ApiResponse.badRequest(res, 'Month and year are required');

      const calendar = await MeetingService.getCalendarView(userId, parseInt(month as string), parseInt(year as string));
      return ApiResponse.success(res, calendar);
    } catch (error: any) {
      logger.error('getCalendarView failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch calendar');
    }
  }

  static async getAvailableSlots(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { accountManagerId, date, durationMinutes } = req.query;
      if (!accountManagerId || !date || !durationMinutes) {
        return ApiResponse.badRequest(res, 'accountManagerId, date, and durationMinutes are required');
      }

      const slots = await MeetingService.getAvailableTimeSlots(
        accountManagerId as string,
        new Date(date as string),
        parseInt(durationMinutes as string)
      );

      return ApiResponse.success(res, { availableSlots: slots });
    } catch (error: any) {
      logger.error('getAvailableSlots failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch available slots');
    }
  }
}

export default MeetingController;
