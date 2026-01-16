/**
 * Talent Application Controller
 * Handles public talent application endpoints
 */

import { Request, Response } from 'express';
import TalentApplicationService from '../services/TalentApplicationService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { TalentApplicationSchema, TalentScheduleSchema } from '../validation/schemas';

export class TalentApplicationController {
  /**
   * Submit talent application (Step 1)
   * POST /api/public/talent/apply
   */
  static async submitApplication(req: Request, res: Response) {
    try {
      // Validate input
      const validatedData = TalentApplicationSchema.parse(req.body);

      const profile = await TalentApplicationService.submitApplication(validatedData);

      // TODO: Send email notification to team
      // TODO: Send confirmation email to applicant

      return ApiResponse.success(res, {
        profileId: profile.id,
        message: 'Application submitted successfully',
      }, 201);
    } catch (error: any) {
      logger.error('Talent application submission failed', error);
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, error.errors[0].message);
      }
      return ApiResponse.error(res, error.message || 'Failed to submit application');
    }
  }

  /**
   * Schedule meeting (Step 2)
   * POST /api/public/talent/schedule
   */
  static async scheduleMeeting(req: Request, res: Response) {
    try {
      // Validate input
      const validatedData = TalentScheduleSchema.parse(req.body);

      const profile = await TalentApplicationService.scheduleMeeting(
        validatedData.profileId,
        {
          preferredMeetingTime: validatedData.preferredMeetingTime,
          meetingNotes: validatedData.meetingNotes,
        }
      );

      // TODO: Send meeting confirmation email
      // TODO: Notify team about scheduled meeting

      return ApiResponse.success(res, {
        message: 'Meeting scheduled successfully',
        profile: {
          id: profile.id,
          email: profile.email,
          preferredMeetingTime: profile.preferredMeetingTime,
          meetingLink: profile.meetingLink,
          scheduledStartTime: profile.scheduledStartTime,
          scheduledEndTime: profile.scheduledEndTime,
        },
      });
    } catch (error: any) {
      logger.error('Meeting scheduling failed', error);
      if (error.name === 'ZodError') {
        return ApiResponse.badRequest(res, error.errors[0].message);
      }
      return ApiResponse.error(res, error.message || 'Failed to schedule meeting');
    }
  }
}

export default TalentApplicationController;
