/**
 * Meeting Mutations
 * Create, update, delete operations
 */

import { prisma } from '../../lib/prisma';
import { MeetingType } from '@prisma/client';
import NotificationService from '../NotificationService';
import { MeetingQueries } from './queries';
import { logger } from '../../utils/logger';

export class MeetingMutations {
  static async createMeeting(data: {
    clientId: string;
    accountManagerId?: string;
    meetingType: MeetingType;
    scheduledAt: Date;
    durationMinutes: number;
    agenda?: string;
    location?: string;
    meetingLink?: string;
    bookingId?: string;
    title?: string;
  }) {
    const meeting = await prisma.meeting.create({
      data: {
        clientId: data.clientId,
        accountManagerId: data.accountManagerId ?? null,
        type: data.meetingType,
        title: data.title || `${data.meetingType.replace(/_/g, ' ')} Meeting`,
        description: data.agenda,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        videoRoomUrl: data.meetingLink,
        googleCalendarEventId: data.bookingId,
        status: 'SCHEDULED',
      },
      include: {
        client: { select: { fullName: true, email: true } },
        accountManager: { select: { fullName: true } },
      },
    });

    const notifications: Promise<any>[] = [
      NotificationService.createNotification({
        userId: data.clientId,
        type: 'INFO',
        title: 'Meeting Scheduled',
        message: `Your meeting has been booked. We'll see you soon!`,
        actionUrl: `/meetings/${meeting.id}`,
        actionLabel: 'View Meeting',
      }),
    ];

    if (data.accountManagerId) {
      notifications.push(
        NotificationService.createNotification({
          userId: data.accountManagerId,
          type: 'INFO',
          title: 'New Meeting',
          message: `Meeting with ${meeting.client.fullName || 'client'} scheduled`,
          actionUrl: `/meetings/${meeting.id}`,
          actionLabel: 'View Meeting',
        })
      );
    }

    await Promise.all(notifications);

    return meeting;
  }

  static async updateMeeting(meetingId: string, updates: Partial<{
    scheduledAt: Date;
    durationMinutes: number;
    agenda: string;
    location: string;
    meetingLink: string;
    notes: string;
  }>) {
    return prisma.meeting.update({
      where: { id: meetingId },
      data: updates,
      include: {
        client: { select: { fullName: true } },
        accountManager: { select: { fullName: true } },
      },
    });
  }

  static async rescheduleMeeting(meetingId: string, newScheduledAt: Date, reason?: string) {
    const meeting = await MeetingQueries.getMeetingById(meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        scheduledAt: newScheduledAt,
        status: 'SCHEDULED',
        notes: reason ? `Rescheduled: ${reason}` : undefined,
      },
    });

    await Promise.all([
      NotificationService.createNotification({
        userId: meeting.clientId,
        type: 'WARNING',
        title: 'Meeting Rescheduled',
        message: `Meeting rescheduled to ${newScheduledAt.toLocaleString()}`,
        actionUrl: `/meetings/${meeting.id}`,
      }),
      meeting.accountManagerId ? NotificationService.createNotification({
        userId: meeting.accountManagerId,
        type: 'WARNING',
        title: 'Meeting Rescheduled',
        message: `Meeting rescheduled to ${newScheduledAt.toLocaleString()}`,
        actionUrl: `/meetings/${meeting.id}`,
      }) : Promise.resolve(),
    ]);

    return updated;
  }

  static async cancelMeeting(meetingId: string, reason?: string) {
    const currentMeeting = await MeetingQueries.getMeetingById(meetingId);
    if (!currentMeeting) throw new Error('Meeting not found');

    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${currentMeeting.notes || ''}\nCancelled: ${reason}` : currentMeeting.notes || undefined,
      },
    });

    // Cancel the booking in Cal.com if we have the booking UID and API key
    const calApiKey = process.env.CAL_COM_API_KEY;
    const calBookingUid = currentMeeting.googleCalendarEventId;
    if (calApiKey && calBookingUid) {
      try {
        await fetch(
          `https://api.cal.com/v1/bookings/${calBookingUid}/cancel?apiKey=${calApiKey}`,
          { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        // Non-fatal: DB record is already cancelled; log and continue
        logger.error('Cal.com API cancel failed', err);
      }
    }

    await Promise.all([
      NotificationService.createNotification({
        userId: meeting.clientId,
        type: 'ERROR',
        title: 'Meeting Cancelled',
        message: reason || 'Your meeting has been cancelled',
        actionUrl: `/meetings/${meeting.id}`,
      }),
      meeting.accountManagerId ? NotificationService.createNotification({
        userId: meeting.accountManagerId,
        type: 'ERROR',
        title: 'Meeting Cancelled',
        message: reason || 'Meeting has been cancelled',
        actionUrl: `/meetings/${meeting.id}`,
      }) : Promise.resolve(),
    ]);

    return meeting;
  }

  static async completeMeeting(meetingId: string, notes?: string) {
    return prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'COMPLETED',
        ...(notes && { notes }),
      },
    });
  }
}
