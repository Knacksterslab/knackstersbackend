/**
 * Meeting Mutations
 * Create, update, delete operations
 */

import { prisma } from '../../lib/prisma';
import { MeetingType } from '@prisma/client';
import NotificationService from '../NotificationService';
import { MeetingQueries } from './queries';

export class MeetingMutations {
  static async createMeeting(data: {
    clientId: string;
    accountManagerId: string;
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
        accountManagerId: data.accountManagerId,
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

    await Promise.all([
      NotificationService.createNotification({
        userId: data.clientId,
        type: 'INFO',
        title: 'Meeting Scheduled',
        message: `Meeting with ${meeting.accountManager?.fullName || 'manager'} scheduled`,
        actionUrl: `/meetings/${meeting.id}`,
        actionLabel: 'View Meeting',
      }),
      NotificationService.createNotification({
        userId: data.accountManagerId,
        type: 'INFO',
        title: 'New Meeting',
        message: `Meeting with ${meeting.client.fullName || 'client'} scheduled`,
        actionUrl: `/meetings/${meeting.id}`,
        actionLabel: 'View Meeting',
      }),
    ]);

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
