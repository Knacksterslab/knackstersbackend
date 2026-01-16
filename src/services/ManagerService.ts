/**
 * Manager Service
 * Orchestrates manager operations
 */

import { prisma } from '../lib/prisma';
import { ManagerQueries } from './managers/queries';

export class ManagerService {
  async getDashboardOverview(managerId: string) {
    const now = new Date();

    const [manager, assignedClients, activeProjects, activeTasks, pendingMeetings, recentActivities, notifications] = await Promise.all([
      prisma.user.findUnique({ where: { id: managerId }, select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } }),
      ManagerQueries.getAssignedClients(managerId),
      prisma.project.count({ where: { client: { accountManagerId: managerId }, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { project: { client: { accountManagerId: managerId } }, status: 'ACTIVE' } }),
      prisma.meeting.findMany({
        where: { client: { accountManagerId: managerId }, scheduledAt: { gte: now }, status: 'SCHEDULED' },
        include: { client: { select: { fullName: true, companyName: true } } },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
      prisma.activityLog.findMany({
        where: { user: { accountManagerId: managerId } },
        include: { user: { select: { fullName: true, companyName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.notification.findMany({ where: { userId: managerId, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return {
      manager,
      stats: {
        totalClients: assignedClients.length,
        activeProjects,
        activeTasks,
        upcomingMeetings: pendingMeetings.length,
        unreadNotifications: notifications.length,
      },
      clients: assignedClients,
      upcomingMeetings: pendingMeetings,
      recentActivities,
      notifications,
    };
  }

  async getClientDetails(managerId: string, clientId: string) {
    return ManagerQueries.getClientDetails(managerId, clientId);
  }

  async getManagerProjects(managerId: string, status?: string) {
    return ManagerQueries.getManagerProjects(managerId, status);
  }

  async getManagerTasks(managerId: string, filters?: { status?: string; clientId?: string; projectId?: string }) {
    return ManagerQueries.getManagerTasks(managerId, filters);
  }

  async getManagerStats(managerId: string) {
    return ManagerQueries.getManagerStats(managerId);
  }

  async getAvailableTalent() {
    return ManagerQueries.getAvailableTalent();
  }
}

export default new ManagerService();
