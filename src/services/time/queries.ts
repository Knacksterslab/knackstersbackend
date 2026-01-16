/**
 * Time Log Queries
 * Read operations for time logs
 */

import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { PrismaHelpers } from '../../utils/prisma-helpers';

export class TimeLogQueries {
  static async getUserTimeLogs(userId: string, filters?: { taskId?: string; projectId?: string; startDate?: Date; endDate?: Date }) {
    const where: Prisma.TimeLogWhereInput = {
      OR: [
        { clientId: userId },
        { userId: userId },
      ],
      ...(filters?.taskId && { taskId: filters.taskId }),
      ...(filters?.projectId && { projectId: filters.projectId }),
      ...(filters?.startDate && filters?.endDate && {
        startTime: { gte: filters.startDate, lte: filters.endDate },
      }),
    };

    return prisma.timeLog.findMany({
      where,
      include: {
        task: { select: { ...PrismaHelpers.selectTaskBasic(), project: { select: PrismaHelpers.selectProjectBasic() } } },
        user: { select: { fullName: true, avatarUrl: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  static async getTimeLogById(timeLogId: string, userId?: string) {
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: timeLogId },
      include: {
        task: { select: { name: true, projectId: true } },
        user: { select: { fullName: true } },
      },
    });

    if (timeLog && userId && timeLog.clientId !== userId && timeLog.userId !== userId) {
      throw new Error('Unauthorized access to time log');
    }

    return timeLog;
  }

  static async getTaskTimeLogs(taskId: string) {
    return prisma.timeLog.findMany({
      where: { taskId },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { startTime: 'desc' },
    });
  }

  static async getProjectTimeSummary(projectId: string) {
    const timeLogs = await prisma.timeLog.findMany({
      where: { projectId },
      include: { task: { select: { name: true } } },
    });

    const totalMinutes = timeLogs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      totalMinutes,
      logCount: timeLogs.length,
      byTask: timeLogs.reduce((acc: any, log) => {
        const taskName = log.task?.name || 'Unknown';
        if (!acc[taskName]) acc[taskName] = 0;
        acc[taskName] += log.durationMinutes || 0;
        return acc;
      }, {}),
    };
  }
}
