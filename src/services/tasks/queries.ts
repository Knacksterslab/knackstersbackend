/**
 * Task Queries
 * All read operations for tasks
 */

import { prisma } from '../../lib/prisma';
import { TaskStatus, Prisma } from '@prisma/client';
import { PrismaHelpers } from '../../utils/prisma-helpers';

export class TaskQueries {
  static async getUserTasks(userId: string, filters?: { status?: TaskStatus; projectId?: string }) {
    const where: Prisma.TaskWhereInput = {
      OR: [
        { project: { clientId: userId } },
        { assignedToId: userId },
        { createdById: userId },
      ],
      ...(filters?.status && { status: filters.status }),
      ...(filters?.projectId && { projectId: filters.projectId }),
    };

    return prisma.task.findMany({
      where,
      include: {
        project: { select: PrismaHelpers.selectProjectBasic() },
        assignedTo: { select: PrismaHelpers.selectUserBasic() },
        createdBy: { select: { fullName: true } },
        timeLogs: { select: { id: true, durationMinutes: true, startTime: true }, orderBy: { startTime: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getTaskById(taskId: string, userId?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { ...PrismaHelpers.selectProjectBasic(), clientId: true } },
        assignedTo: { select: PrismaHelpers.selectUserBasic() },
        createdBy: { select: PrismaHelpers.selectUserBasic() },
        timeLogs: { select: { id: true, durationMinutes: true, startTime: true, user: { select: { fullName: true } } }, orderBy: { startTime: 'desc' } },
      },
    });

    if (task && userId) {
      const hasAccess = task.project.clientId === userId || task.assignedToId === userId || task.createdById === userId;
      if (!hasAccess) throw new Error('Unauthorized access to task');
    }

    return task;
  }

  static async getProjectTasks(projectId: string, status?: TaskStatus) {
    return prisma.task.findMany({
      where: {
        projectId,
        ...(status && { status }),
      },
      include: {
        assignedTo: { select: PrismaHelpers.selectUserBasic() },
        timeLogs: { select: { durationMinutes: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  static async getTaskStats(projectId: string) {
    const [total, active, completed, inReview, totalMinutes] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { projectId, status: 'ACTIVE' } }),
      prisma.task.count({ where: { projectId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { projectId, status: 'IN_REVIEW' } }),
      prisma.timeLog.aggregate({ where: { task: { projectId } }, _sum: { durationMinutes: true } }),
    ]);

    return {
      total,
      active,
      completed,
      inReview,
      totalHours: Number(totalMinutes._sum.durationMinutes || 0) / 60,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
    };
  }
}
