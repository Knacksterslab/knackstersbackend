/**
 * Talent Service
 * Orchestrates talent operations
 */

import { prisma } from '../lib/prisma';
import { PrismaHelpers } from '../utils/prisma-helpers';
import { startOfMonth, endOfMonth } from 'date-fns';

export class TalentService {
  async getDashboardOverview(talentId: string) {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);

    const [talent, activeTasks, completedTasks, upcomingMeetings, timeLogs, recentActivities, notifications] = await Promise.all([
      prisma.user.findUnique({ where: { id: talentId }, select: PrismaHelpers.selectUserBasic() }),
      prisma.task.findMany({ where: { assignedToId: talentId, status: 'ACTIVE' }, include: { project: { select: { title: true, client: { select: { fullName: true } } } } }, orderBy: { dueDate: 'asc' }, take: 10 }),
      prisma.task.count({ where: { assignedToId: talentId, status: 'COMPLETED', completedAt: { gte: startOfThisMonth, lte: endOfThisMonth } } }),
      prisma.meeting.findMany({ where: { clientId: talentId, scheduledAt: { gte: now }, status: 'SCHEDULED' }, include: { client: { select: { fullName: true } } }, orderBy: { scheduledAt: 'asc' }, take: 5 }),
      prisma.timeLog.findMany({ where: { userId: talentId, startTime: { gte: startOfThisMonth, lte: endOfThisMonth } }, select: { durationMinutes: true, startTime: true, task: { select: { name: true } } }, orderBy: { startTime: 'desc' }, take: 10 }),
      prisma.activityLog.findMany({ where: { userId: talentId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.notification.findMany({ where: { userId: talentId, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    const totalMinutes = timeLogs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
    const hourlyRate = 50;

    return {
      talent,
      stats: {
        activeTasks: activeTasks.length,
        completedThisMonth: completedTasks,
        hoursThisMonth: (totalMinutes / 60).toFixed(1),
        earningsThisMonth: ((totalMinutes / 60) * hourlyRate).toFixed(2),
        upcomingMeetings: upcomingMeetings.length,
        unreadNotifications: notifications.length,
      },
      activeTasks,
      upcomingMeetings,
      recentTimeLogs: timeLogs,
      recentActivities,
      notifications,
    };
  }

  async getEarnings(talentId: string, startDate?: Date, endDate?: Date) {
    const timeLogs = await prisma.timeLog.findMany({
      where: {
        userId: talentId,
        ...(startDate && endDate && { startTime: { gte: startDate, lte: endDate } }),
      },
      include: { task: { select: { name: true, project: { select: { title: true } } } } },
      orderBy: { startTime: 'desc' },
    });

    const totalMinutes = timeLogs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
    const hourlyRate = 50;

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      totalEarnings: ((totalMinutes / 60) * hourlyRate).toFixed(2),
      hourlyRate,
      timeLogs,
    };
  }

  async getTaskHistory(talentId: string, limit?: number) {
    return prisma.task.findMany({
      where: { assignedToId: talentId },
      include: { project: { select: { title: true, client: { select: { fullName: true } } } } },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  }
}

export default new TalentService();
