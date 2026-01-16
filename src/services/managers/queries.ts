/**
 * Manager Queries
 * All read operations for manager dashboard
 */

import { prisma } from '../../lib/prisma';
import { PrismaHelpers } from '../../utils/prisma-helpers';

export class ManagerQueries {
  static async getManagerStats(managerId: string) {
    const now = new Date();

    const [totalClients, activeClients, totalProjects, activeProjects, completedProjects, totalTasks, completedTasks, totalMeetings, upcomingMeetings] = await Promise.all([
      prisma.user.count({ where: { accountManagerId: managerId, role: 'CLIENT' } }),
      prisma.user.count({ where: { accountManagerId: managerId, role: 'CLIENT', clientProjects: { some: { status: 'IN_PROGRESS' } } } }),
      prisma.project.count({ where: { client: { accountManagerId: managerId } } }),
      prisma.project.count({ where: { client: { accountManagerId: managerId }, status: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { client: { accountManagerId: managerId }, status: 'COMPLETED' } }),
      prisma.task.count({ where: { project: { client: { accountManagerId: managerId } } } }),
      prisma.task.count({ where: { project: { client: { accountManagerId: managerId } }, status: 'COMPLETED' } }),
      prisma.meeting.count({ where: { client: { accountManagerId: managerId } } }),
      prisma.meeting.count({ where: { client: { accountManagerId: managerId }, scheduledAt: { gte: now }, status: 'SCHEDULED' } }),
    ]);

    return {
      clients: { total: totalClients, active: activeClients },
      projects: { total: totalProjects, active: activeProjects, completed: completedProjects, completionRate: totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : '0' },
      tasks: { total: totalTasks, completed: completedTasks, completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0' },
      meetings: { total: totalMeetings, upcoming: upcomingMeetings },
    };
  }

  static async getAssignedClients(managerId: string) {
    const now = new Date();

    return prisma.user.findMany({
      where: { accountManagerId: managerId, role: 'CLIENT' },
      include: {
        subscriptions: { where: { status: 'ACTIVE' }, select: { plan: true, status: true }, take: 1 },
        hoursBalances: { where: { periodEnd: { gte: now } }, take: 1 },
        _count: { select: { clientProjects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getManagerProjects(managerId: string, status?: string) {
    const where: any = { client: { accountManagerId: managerId } };
    if (status) where.status = status;

    return prisma.project.findMany({
      where,
      include: {
        client: { select: { fullName: true, companyName: true } },
        assignees: { include: { user: { select: PrismaHelpers.selectUserBasic() } } },
        tasks: { select: { id: true, status: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getManagerTasks(managerId: string, filters?: { status?: string; clientId?: string; projectId?: string }) {
    const where: any = { project: { client: { accountManagerId: managerId } } };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.project = { ...where.project, clientId: filters.clientId };
    if (filters?.projectId) where.projectId = filters.projectId;

    return prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            title: true,
            projectNumber: true,
            client: { select: { fullName: true, companyName: true } },
          },
        },
        assignedTo: { select: { fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAvailableTalent() {
    return prisma.user.findMany({
      where: { role: 'TALENT', status: 'ACTIVE' },
      select: {
        ...PrismaHelpers.selectUserBasic(),
        _count: { select: { assignedTasks: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  static async getClientDetails(managerId: string, clientId: string) {
    const client = await prisma.user.findFirst({
      where: { id: clientId, accountManagerId: managerId },
      include: {
        subscriptions: { where: { status: 'ACTIVE' }, take: 1 },
        hoursBalances: { where: { periodEnd: { gte: new Date() } }, take: 1 },
        clientProjects: {
          include: {
            tasks: { select: { id: true, status: true } },
            _count: { select: { tasks: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { clientProjects: true, notifications: true } },
      },
    });

    if (!client) throw new Error('Client not found or not assigned to this manager');
    return client;
  }
}
