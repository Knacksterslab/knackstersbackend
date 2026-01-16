/**
 * Hours Balance Queries
 * Read operations for hours balance
 */

import { prisma } from '../../lib/prisma';

export class HoursQueries {
  static async getCurrentBalance(userId: string) {
    const now = new Date();

    return prisma.hoursBalance.findFirst({
      where: {
        userId,
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
      include: {
        subscription: {
          select: { plan: true, monthlyHours: true },
        },
      },
    });
  }

  static async getBalanceHistory(userId: string, limit = 12) {
    return prisma.hoursBalance.findMany({
      where: { userId },
      include: {
        subscription: { select: { plan: true } },
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });
  }

  static async getUsageByProject(userId: string, startDate: Date, endDate: Date) {
    const timeLogs = await prisma.timeLog.findMany({
      where: {
        clientId: userId,
        startTime: { gte: startDate, lte: endDate },
      },
      include: {
        project: { select: { id: true, title: true, projectNumber: true } },
        task: { select: { name: true } },
      },
    });

    const projectUsage = timeLogs.reduce((acc: any, log) => {
      const projectId = log.projectId;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: log.project,
          totalMinutes: 0,
          tasks: [],
        };
      }
      acc[projectId].totalMinutes += log.durationMinutes || 0;
      return acc;
    }, {});

    return Object.values(projectUsage).map((usage: any) => ({
      ...usage,
      totalHours: (usage.totalMinutes / 60).toFixed(1),
    }));
  }
}
