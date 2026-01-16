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
    console.log('=== DASHBOARD SERVICE START ===');
    console.log('Fetching dashboard for userId:', userId);
    console.log('UserId type:', typeof userId, 'length:', userId?.length);

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

    console.log('User lookup result:', !!user);
    if (user) {
      console.log('User found with email:', user.email, 'role:', user.role);
      console.log('User ID in DB:', user.id);
    } else {
      console.log('User NOT found in database');
      // Let's try to find any user with similar email or check if users exist at all
      const allUsers = await prisma.user.findMany({ take: 5, select: { id: true, email: true } });
      console.log('Sample users in DB:', allUsers);
    }

    if (!user) {
      console.log('Throwing User not found error');
      throw new Error('User not found');
    }

      // Get active subscription (may be null for new users)
      const subscription = await SubscriptionService.getActiveSubscription(userId);

      // Get current hours balance (may be null for new users)
      const hoursBalance = await HoursBalanceService.getCurrentBalance(userId);

      // Get recent tasks (will be empty array for new users)
      const recentTasks = await prisma.task.findMany({
        where: {
          project: {
            clientId: userId,
          },
          status: {
            in: ['ACTIVE', 'IN_REVIEW'],
          },
        },
        take: 5,
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          project: {
            select: {
              title: true,
            },
          },
          assignedTo: {
            select: {
              fullName: true,
              avatarUrl: true,
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
        recentTasks: recentTasks.map((task) => ({
          id: task.id,
          taskNumber: task.taskNumber,
          name: task.name,
          status: task.status,
          projectName: task.project.title,
          assignedTo: task.assignedTo
            ? {
                fullName: task.assignedTo.fullName || 'Unassigned',
                avatarUrl: task.assignedTo.avatarUrl,
              }
            : null,
          dueDate: task.dueDate,
          loggedMinutes: Number(task.loggedMinutes),
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
            }
          : null,
      };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId: string) {
    const [
      totalProjects,
      activeProjects,
      totalTasks,
      activeTasks,
      completedTasks,
      unreadNotifications,
    ] = await Promise.all([
      prisma.project.count({ where: { clientId: userId } }),
      prisma.project.count({ where: { clientId: userId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { project: { clientId: userId } } }),
      prisma.task.count({
        where: { project: { clientId: userId }, status: { in: ['ACTIVE', 'IN_REVIEW'] } },
      }),
      prisma.task.count({ where: { project: { clientId: userId }, status: 'COMPLETED' } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      tasks: {
        total: totalTasks,
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
