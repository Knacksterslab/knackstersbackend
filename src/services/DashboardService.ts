/**
 * Dashboard Service
 * Aggregates data for client dashboard overview
 */

import { prisma } from '../lib/prisma';
import HoursBalanceService from './HoursBalanceService';
import SubscriptionService from './SubscriptionService';
import { DashboardOverview } from '../types';

export class DashboardService {
  /**
   * Get complete dashboard overview for a client
   */
  async getDashboardOverview(userId: string): Promise<DashboardOverview> {

    // Fetch user with account manager
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

      // Get active subscription (may be null for new users)
      const subscription = await SubscriptionService.getActiveSubscription(userId);

      // Get current hours balance (may be null for new users)
      const hoursBalance = await HoursBalanceService.getCurrentBalance(userId);

      // Get recent projects (work requests) with their tasks
      const recentProjects = await prisma.project.findMany({
        where: {
          clientId: userId,
          status: {
            in: ['NOT_STARTED', 'IN_PROGRESS'],
          },
        },
        take: 10,
        orderBy: [
          { createdAt: 'desc' },
        ],
        include: {
          tasks: {
            include: {
              assignedTo: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      // Get recent notifications (will be empty array for new users)
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get upcoming meeting (next scheduled meeting for this client)
      const upcomingMeeting = await prisma.meeting.findFirst({
        where: {
          clientId: userId,
          scheduledAt: {
            gte: new Date(), // Only future meetings
          },
          status: 'SCHEDULED',
        },
        orderBy: {
          scheduledAt: 'asc', // Get the earliest upcoming meeting
        },
        select: {
          id: true,
          scheduledAt: true,
          durationMinutes: true,
          videoRoomUrl: true,
          title: true,
          description: true,
          googleCalendarEventId: true, // Cal.com booking UID for rescheduling/canceling
        },
      });

      // Format response - all null values are handled gracefully
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          companyName: user.companyName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              monthlyHours: subscription.monthlyHours,
              priceAmount: Number(subscription.priceAmount),
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              nextBillingDate: subscription.nextBillingDate,
            }
          : null,
        hoursBalance: hoursBalance
          ? {
              periodStart: hoursBalance.periodStart,
              periodEnd: hoursBalance.periodEnd,
              allocatedHours: hoursBalance.allocatedHours,
              bonusHours: hoursBalance.bonusHours,
              extraPurchasedHours: hoursBalance.extraPurchasedHours,
              totalAvailableHours: hoursBalance.allocatedHours + hoursBalance.bonusHours + hoursBalance.extraPurchasedHours + Number(hoursBalance.rolloverHours),
              hoursUsed: Number(hoursBalance.hoursUsed),
              hoursRemaining: hoursBalance.allocatedHours + hoursBalance.bonusHours + hoursBalance.extraPurchasedHours + Number(hoursBalance.rolloverHours) - Number(hoursBalance.hoursUsed),
              usagePercentage: hoursBalance.allocatedHours + hoursBalance.bonusHours + hoursBalance.extraPurchasedHours + Number(hoursBalance.rolloverHours) > 0 
                ? (Number(hoursBalance.hoursUsed) / (hoursBalance.allocatedHours + hoursBalance.bonusHours + hoursBalance.extraPurchasedHours + Number(hoursBalance.rolloverHours))) * 100 
                : 0,
            }
          : null,
        recentProjects: recentProjects.map((project) => ({
          id: project.id,
          projectNumber: project.projectNumber,
          title: project.title,
          description: project.description,
          status: project.status,
          priority: project.priority,
          estimatedHours: project.estimatedHours ? Number(project.estimatedHours) : null,
          dueDate: project.dueDate,
          createdAt: project.createdAt,
          tasks: project.tasks.map((task) => ({
            id: task.id,
            taskNumber: task.taskNumber,
            name: task.name,
            status: task.status,
            priority: task.priority,
            assignedTo: task.assignedTo
              ? {
                  fullName: task.assignedTo.fullName || 'Unassigned',
                  avatarUrl: task.assignedTo.avatarUrl,
                }
              : null,
            dueDate: task.dueDate,
            loggedMinutes: Number(task.loggedMinutes),
            estimatedMinutes: task.estimatedMinutes,
          })),
        })),
        notifications: notifications.map((notif) => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
        })),
        accountManager: user.accountManager
          ? {
              id: user.accountManager.id,
              fullName: user.accountManager.fullName || 'Account Manager',
              email: user.accountManager.email,
              avatarUrl: user.accountManager.avatarUrl,
              isAvailable: user.accountManager.status === 'ACTIVE',
            }
          : null,
        upcomingMeeting: upcomingMeeting
          ? {
              id: upcomingMeeting.id,
              scheduledAt: upcomingMeeting.scheduledAt,
              durationMinutes: upcomingMeeting.durationMinutes,
              videoRoomUrl: upcomingMeeting.videoRoomUrl,
              title: upcomingMeeting.title,
              description: upcomingMeeting.description,
              bookingId: upcomingMeeting.googleCalendarEventId, // Cal.com UID
            }
          : null,
      };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId: string) {
    const [
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      totalTasks,
      pendingTasks,
      activeTasks,
      completedTasks,
      unreadNotifications,
    ] = await Promise.all([
      prisma.project.count({ where: { clientId: userId } }),
      prisma.project.count({ where: { clientId: userId, status: 'NOT_STARTED' } }),
      prisma.project.count({ where: { clientId: userId, status: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { clientId: userId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { project: { clientId: userId } } }),
      prisma.task.count({ where: { project: { clientId: userId }, status: 'PENDING' } }),
      prisma.task.count({
        where: { project: { clientId: userId }, status: { in: ['ACTIVE', 'IN_REVIEW'] } },
      }),
      prisma.task.count({ where: { project: { clientId: userId }, status: 'COMPLETED' } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        active: activeRequests,
        completed: completedRequests,
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        active: activeTasks,
        completed: completedTasks,
      },
      notifications: {
        unread: unreadNotifications,
      },
    };
  }

  /**
   * Get dashboard statistics
   */
}

export default new DashboardService();
