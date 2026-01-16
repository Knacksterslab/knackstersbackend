/**
 * Time Log Mutations
 * Create, update, delete operations
 */

import { prisma } from '../../lib/prisma';

export class TimeLogMutations {
  static async logTime(data: {
    taskId: string;
    projectId: string;
    clientId: string;
    userId: string;
    durationMinutes: number;
    startTime: Date;
    description?: string;
  }) {
    return prisma.timeLog.create({
      data,
      include: {
        task: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    });
  }

  static async updateTimeLog(timeLogId: string, updates: Partial<{
    durationMinutes: number;
    startTime: Date;
    description: string;
  }>) {
    return prisma.timeLog.update({
      where: { id: timeLogId },
      data: updates,
    });
  }

  static async deleteTimeLog(timeLogId: string) {
    return prisma.timeLog.delete({
      where: { id: timeLogId },
    });
  }
}
