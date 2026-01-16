/**
 * Project Queries
 * Read operations for projects
 */

import { prisma } from '../../lib/prisma';
import { ProjectStatus, Prisma } from '@prisma/client';
import { PrismaHelpers } from '../../utils/prisma-helpers';

export class ProjectQueries {
  static async getClientProjects(clientId: string, status?: ProjectStatus) {
    const where: Prisma.ProjectWhereInput = {
      clientId,
      ...(status && { status }),
    };

    return prisma.project.findMany({
      where,
      include: {
        tasks: { select: { id: true, status: true } },
        assignees: { include: { user: { select: PrismaHelpers.selectUserBasic() } } },
        _count: { select: { tasks: true, timeLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getProjectById(projectId: string, clientId?: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { fullName: true, companyName: true } },
        tasks: { include: { assignedTo: { select: PrismaHelpers.selectUserBasic() }, timeLogs: { select: { durationMinutes: true } } } },
        assignees: { include: { user: { select: PrismaHelpers.selectUserBasic() } } },
        timeLogs: { select: { durationMinutes: true } },
        _count: { select: { tasks: true, timeLogs: true } },
      },
    });

    if (project && clientId && project.clientId !== clientId) {
      throw new Error('Unauthorized access to project');
    }

    return project;
  }

  static async getProjectStats(projectId: string) {
    const [project, taskStats, timeStats] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { estimatedHours: true, status: true },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true },
      }),
      prisma.timeLog.aggregate({
        where: { projectId },
        _sum: { durationMinutes: true },
      }),
    ]);

    const totalMinutes = Number(timeStats._sum.durationMinutes || 0);

    return {
      estimatedHours: project?.estimatedHours || 0,
      actualHours: (totalMinutes / 60).toFixed(1),
      status: project?.status,
      tasks: taskStats.reduce((acc: any, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {}),
    };
  }
}
