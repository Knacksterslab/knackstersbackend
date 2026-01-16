/**
 * Meeting Service
 * Orchestrates meeting operations
 */

import { MeetingType, MeetingStatus } from '@prisma/client';
import { MeetingQueries } from './meetings/queries';
import { MeetingMutations } from './meetings/mutations';

export class MeetingService {
  // Queries
  async getUserMeetings(userId: string, status?: MeetingStatus) {
    return MeetingQueries.getUserMeetings(userId, status);
  }

  async getUpcomingMeetings(userId: string, limit?: number) {
    return MeetingQueries.getUpcomingMeetings(userId, limit);
  }

  async getPastMeetings(userId: string, limit?: number) {
    return MeetingQueries.getPastMeetings(userId, limit);
  }

  async getMeetingById(meetingId: string, userId?: string) {
    return MeetingQueries.getMeetingById(meetingId, userId);
  }

  async getMeetingsByDateRange(userId: string, startDate: Date, endDate: Date) {
    return MeetingQueries.getMeetingsByDateRange(userId, startDate, endDate);
  }

  async checkMeetingConflict(userId: string, scheduledAt: Date, durationMinutes: number) {
    return MeetingQueries.checkConflict(userId, scheduledAt, durationMinutes);
  }

  // Mutations
  async scheduleMeeting(data: {
    clientId: string;
    accountManagerId: string;
    meetingType: MeetingType;
    scheduledAt: Date;
    durationMinutes: number;
    agenda?: string;
    location?: string;
    meetingLink?: string;
  }) {
    const hasConflict = await this.checkMeetingConflict(
      data.clientId,
      data.scheduledAt,
      data.durationMinutes
    );

    if (hasConflict) {
      throw new Error('Time slot conflicts with existing meeting');
    }

    return MeetingMutations.createMeeting(data);
  }

  async updateMeeting(meetingId: string, updates: any) {
    return MeetingMutations.updateMeeting(meetingId, updates);
  }

  async rescheduleMeeting(meetingId: string, newScheduledAt: Date, reason?: string) {
    return MeetingMutations.rescheduleMeeting(meetingId, newScheduledAt, reason);
  }

  async cancelMeeting(meetingId: string, reason?: string) {
    return MeetingMutations.cancelMeeting(meetingId, reason);
  }

  async completeMeeting(meetingId: string, notes?: string) {
    return MeetingMutations.completeMeeting(meetingId, notes);
  }

  // Calendar operations
  async getCalendarView(userId: string, month: number, year: number) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    return this.getMeetingsByDateRange(userId, startDate, endDate);
  }

  async getAvailableTimeSlots(accountManagerId: string, date: Date, durationMinutes: number) {
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0);

    const bookedMeetings = await this.getMeetingsByDateRange(
      accountManagerId,
      startOfDay,
      endOfDay
    );

    const slots: Date[] = [];
    let currentTime = startOfDay;

    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);

      const isBooked = bookedMeetings.some((meeting) => {
        const meetingStart = meeting.scheduledAt;
        const meetingEnd = new Date(meetingStart.getTime() + meeting.durationMinutes * 60000);
        return currentTime < meetingEnd && slotEnd > meetingStart;
      });

      if (!isBooked) {
        slots.push(new Date(currentTime));
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30 min intervals
    }

    return slots;
  }
}

export default new MeetingService();
