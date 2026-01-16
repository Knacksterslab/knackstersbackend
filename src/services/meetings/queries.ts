/**
 * Meeting Queries
 * All read operations for meetings
 */

import { prisma } from '../../lib/prisma';
import { MeetingStatus, Prisma } from '@prisma/client';
import { PrismaHelpers } from '../../utils/prisma-helpers';

const meetingInclude = {
  client: { select: PrismaHelpers.selectUserBasic() },
  accountManager: { select: PrismaHelpers.selectUserBasic() },
};

export class MeetingQueries {
  static async getUserMeetings(userId: string, status?: MeetingStatus) {
    const where: Prisma.MeetingWhereInput = {
      OR: [{ clientId: userId }, { accountManagerId: userId }],
      ...(status && { status }),
    };

    return prisma.meeting.findMany({
      where,
      include: meetingInclude,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  static async getUpcomingMeetings(userId: string, limit?: number) {
    return prisma.meeting.findMany({
      where: {
        OR: [{ clientId: userId }, { accountManagerId: userId }],
        scheduledAt: { gte: new Date() },
        status: 'SCHEDULED',
      },
      include: meetingInclude,
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  }

  static async getMeetingById(meetingId: string, userId?: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: meetingInclude,
    });

    if (meeting && userId && meeting.clientId !== userId && meeting.accountManagerId !== userId) {
      throw new Error('Unauthorized access to meeting');
    }

    return meeting;
  }

  static async getPastMeetings(userId: string, limit?: number) {
    return prisma.meeting.findMany({
      where: {
        OR: [{ clientId: userId }, { accountManagerId: userId }],
        scheduledAt: { lt: new Date() },
        status: 'COMPLETED',
      },
      include: meetingInclude,
      orderBy: { scheduledAt: 'desc' },
      take: limit,
    });
  }

  static async getMeetingsByDateRange(userId: string, startDate: Date, endDate: Date) {
    return prisma.meeting.findMany({
      where: {
        OR: [{ clientId: userId }, { accountManagerId: userId }],
        scheduledAt: PrismaHelpers.dateRange(startDate, endDate),
      },
      include: meetingInclude,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  static async checkConflict(userId: string, scheduledAt: Date, _durationMinutes: number) {
    const conflicts = await prisma.meeting.count({
      where: {
        OR: [{ clientId: userId }, { accountManagerId: userId }],
        scheduledAt: scheduledAt,
        status: 'SCHEDULED',
      },
    });

    return conflicts > 0;
  }
}
