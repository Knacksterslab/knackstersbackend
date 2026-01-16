/**
 * Talent Application Service
 * Handles talent network applications and onboarding
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { EmploymentStatus, WorkType } from '@prisma/client';
import GoogleCalendarService from './GoogleCalendarService';

export class TalentApplicationService {
  /**
   * Submit talent application
   */
  async submitApplication(data: {
    firstName: string;
    lastName: string;
    email: string;
    primaryExpertise: string;
    additionalSkills?: string;
    profileUrls?: string[];
    currentEmploymentStatus: EmploymentStatus;
    preferredWorkType: WorkType;
    hourlyRate: number;
  }) {
    // Check if email already exists
    const existingProfile = await prisma.talentProfile.findUnique({
      where: { email: data.email },
    });

    if (existingProfile) {
      throw new Error('A profile with this email already exists');
    }

    // Create talent profile
    const profile = await prisma.talentProfile.create({
      data: {
        ...data,
        profileUrls: data.profileUrls || [],
        status: 'PENDING_REVIEW',
      },
    });

    logger.info(`Talent application submitted: ${profile.email}`);
    
    return profile;
  }

  /**
   * Update with meeting schedule
   */
  async scheduleMeeting(profileId: string, data: {
    preferredMeetingTime: string;
    meetingNotes?: string;
  }) {
    // Get the talent profile first
    const existingProfile = await prisma.talentProfile.findUnique({
      where: { id: profileId },
    });

    if (!existingProfile) {
      throw new Error('Talent profile not found');
    }

    // Create Google Calendar event
    let calendarEventData = null;
    try {
      calendarEventData = await GoogleCalendarService.createMeetingEvent({
        email: existingProfile.email,
        firstName: existingProfile.firstName,
        lastName: existingProfile.lastName,
        preferredMeetingTime: data.preferredMeetingTime,
        profileId,
      });
      
      if (calendarEventData) {
        logger.info(`Calendar event created for ${existingProfile.email}: ${calendarEventData.eventId}`);
      } else {
        logger.warn(`Calendar event creation failed for ${existingProfile.email}, continuing without calendar integration`);
      }
    } catch (error: any) {
      logger.error('Error creating calendar event:', error);
      // Continue even if calendar creation fails
    }

    // Update profile with meeting schedule and calendar data
    const profile = await prisma.talentProfile.update({
      where: { id: profileId },
      data: {
        preferredMeetingTime: data.preferredMeetingTime,
        meetingNotes: data.meetingNotes,
        status: 'INTERVIEW_SCHEDULED',
        calendarBookingId: calendarEventData?.eventId || null,
        meetingLink: calendarEventData?.meetLink || null,
        scheduledStartTime: calendarEventData?.startTime ? new Date(calendarEventData.startTime) : null,
        scheduledEndTime: calendarEventData?.endTime ? new Date(calendarEventData.endTime) : null,
      },
    });

    logger.info(`Meeting scheduled for talent: ${profile.email}`);
    
    return profile;
  }

  /**
   * Get pending applications (for managers/admins)
   */
  async getPendingApplications() {
    return prisma.talentProfile.findMany({
      where: {
        status: { in: ['PENDING_REVIEW', 'INTERVIEW_SCHEDULED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new TalentApplicationService();
