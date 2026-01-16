/**
 * Cal.com Webhook Controller
 * Handles incoming webhooks from Cal.com for booking events
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { MeetingType } from '@prisma/client';
import NotificationService from '../services/NotificationService';
import crypto from 'crypto';

interface CalComWebhookPayload {
  triggerEvent: string;
  createdAt: string;
  payload: {
    type: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees: Array<{
      email: string;
      name: string;
      timeZone: string;
    }>;
    organizer: {
      email: string;
      name: string;
      timeZone: string;
    };
    location?: string;
    uid: string;
    metadata?: Record<string, any>;
  };
}

export class CalComWebhookController {
  /**
   * Verify Cal.com webhook signature
   */
  private static verifySignature(req: Request): boolean {
    const signature = req.headers['x-cal-signature'] as string;
    const webhookSecret = process.env.CAL_COM_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn('CAL_COM_WEBHOOK_SECRET not configured');
      return false; // Allow in development if secret not set
    }

    if (!signature) {
      logger.warn('No signature provided in webhook');
      return false;
    }

    try {
      // Cal.com uses HMAC-SHA256 for signing
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  /**
   * Handle booking created event
   */
  static async handleBooking(req: Request, res: Response) {
    try {
      // Verify webhook signature
      if (process.env.NODE_ENV === 'production') {
        const isValid = this.verifySignature(req);
        if (!isValid) {
          logger.warn('Invalid webhook signature');
          return ApiResponse.unauthorized(res, 'Invalid signature');
        }
      }

      const webhookData: CalComWebhookPayload = req.body;

      logger.info('Cal.com webhook received', {
        event: webhookData.triggerEvent,
        bookingId: webhookData.payload.uid,
      });

      // Only handle BOOKING_CREATED events
      if (webhookData.triggerEvent !== 'BOOKING_CREATED') {
        logger.info(`Ignoring webhook event: ${webhookData.triggerEvent}`);
        return ApiResponse.success(res, { received: true });
      }

      const { payload } = webhookData;

      // Extract attendee information (first attendee is the applicant/client)
      const attendee = payload.attendees[0];
      if (!attendee) {
        logger.error('No attendee found in booking');
        return ApiResponse.badRequest(res, 'No attendee information');
      }

      // Determine booking type based on event type or metadata
      const isClientOnboarding = payload.type.toLowerCase().includes('client') || 
                                 payload.type.toLowerCase().includes('onboarding') ||
                                 payload.title.toLowerCase().includes('client') ||
                                 payload.title.toLowerCase().includes('onboarding');

      if (isClientOnboarding) {
        // Handle client onboarding call
        logger.info('Processing client onboarding booking', { email: attendee.email });

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: attendee.email },
        });

        if (!user) {
          logger.error(`No user found for email: ${attendee.email}`);
          return ApiResponse.notFound(res, 'User');
        }

        // Calculate duration in minutes
        const startTime = new Date(payload.startTime);
        const endTime = new Date(payload.endTime);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        // Create Meeting record
        const meeting = await prisma.meeting.create({
          data: {
            clientId: user.id,
            type: MeetingType.MEET_AND_GREET,
            title: payload.title || 'Client Onboarding Call',
            description: payload.description || 'Welcome! Let\'s discuss your project needs and how we can help.',
            scheduledAt: startTime,
            durationMinutes: durationMinutes,
            timezone: attendee.timeZone,
            status: 'SCHEDULED',
            videoRoomUrl: payload.location || null,
            attendees: {
              attendee: {
                email: attendee.email,
                name: attendee.name,
                timeZone: attendee.timeZone,
              },
              organizer: payload.organizer,
            },
          },
        });

        logger.info('Client meeting created', {
          meetingId: meeting.id,
          userId: user.id,
          bookingId: payload.uid,
          startTime: payload.startTime,
        });

        // Create notification for client
        try {
          await NotificationService.createNotification({
            userId: user.id,
            type: 'SUCCESS',
            title: 'Onboarding Call Scheduled',
            message: `Your onboarding call is scheduled for ${startTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })} at ${startTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}. We look forward to speaking with you!`,
            actionUrl: meeting.videoRoomUrl || undefined,
            actionLabel: meeting.videoRoomUrl ? 'Join Meeting' : undefined,
          });

          logger.info('Notification created for client', { userId: user.id });
        } catch (notifError) {
          logger.error('Failed to create notification', notifError);
        }

        // Log activity
        try {
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              activityType: 'MEETING_SCHEDULED',
              description: `Onboarding call scheduled for ${startTime.toLocaleString()}`,
              metadata: {
                bookingId: payload.uid,
                meetingId: meeting.id,
                meetingLink: payload.location,
                startTime: payload.startTime,
                endTime: payload.endTime,
              },
            },
          });
        } catch (logError) {
          logger.error('Failed to create activity log', logError);
        }

        return ApiResponse.success(res, {
          received: true,
          type: 'client_onboarding',
          userId: user.id,
          meetingId: meeting.id,
          bookingId: payload.uid,
        });
      } else {
        // Handle talent interview booking (existing logic)
        logger.info('Processing talent interview booking', { email: attendee.email });

        // Find talent profile by email
        const talentProfile = await prisma.talentProfile.findUnique({
          where: { email: attendee.email },
        });

        if (!talentProfile) {
          logger.error(`No talent profile found for email: ${attendee.email}`);
          return ApiResponse.notFound(res, 'Talent profile');
        }

        // Update talent profile with booking information
        const updatedProfile = await prisma.talentProfile.update({
          where: { id: talentProfile.id },
          data: {
            calendarBookingId: payload.uid,
            meetingLink: payload.location || null,
            scheduledStartTime: new Date(payload.startTime),
            scheduledEndTime: new Date(payload.endTime),
            attendeeName: attendee.name,
            attendeeTimezone: attendee.timeZone,
            status: 'INTERVIEW_SCHEDULED',
          },
        });

        logger.info('Talent profile updated with booking', {
          profileId: updatedProfile.id,
          bookingId: payload.uid,
          startTime: payload.startTime,
        });

        // Log activity
        try {
          await prisma.activityLog.create({
            data: {
              userId: talentProfile.id,
              activityType: 'MEETING_SCHEDULED',
              description: `Interview scheduled for ${new Date(payload.startTime).toLocaleString()}`,
              metadata: {
                bookingId: payload.uid,
                meetingLink: payload.location,
                startTime: payload.startTime,
                endTime: payload.endTime,
              },
            },
          });
        } catch (logError) {
          // Don't fail webhook if activity log fails
          logger.error('Failed to create activity log', logError);
        }

        return ApiResponse.success(res, {
          received: true,
          type: 'talent_interview',
          profileId: updatedProfile.id,
          bookingId: payload.uid,
        });
      }
    } catch (error: any) {
      logger.error('Cal.com webhook processing failed', error);
      return ApiResponse.error(res, error.message || 'Webhook processing failed');
    }
  }

  /**
   * Get booking details by profile ID
   */
  static async getBookingDetails(req: Request, res: Response) {
    try {
      const { profileId } = req.params;

      const profile = await prisma.talentProfile.findUnique({
        where: { id: profileId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          calendarBookingId: true,
          meetingLink: true,
          scheduledStartTime: true,
          scheduledEndTime: true,
          attendeeName: true,
          attendeeTimezone: true,
          status: true,
        },
      });

      if (!profile) {
        return ApiResponse.notFound(res, 'Talent profile');
      }

      if (!profile.calendarBookingId) {
        return ApiResponse.notFound(res, 'Booking');
      }

      return ApiResponse.success(res, {
        bookingId: profile.calendarBookingId,
        meetingLink: profile.meetingLink,
        startTime: profile.scheduledStartTime,
        endTime: profile.scheduledEndTime,
        attendeeName: profile.attendeeName,
        timezone: profile.attendeeTimezone,
        status: profile.status,
      });
    } catch (error: any) {
      logger.error('Failed to fetch booking details', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch booking details');
    }
  }
}

export default CalComWebhookController;
