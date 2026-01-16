/**
 * Activity Log Service
 * Tracks user activities and system events for audit trail
 */

import { prisma } from '../lib/prisma';
import { ActivityType } from '@prisma/client';

export class ActivityLogService {
  /**
   * Log an activity
   */
  async logActivity(data: {
    userId: string;
    activityType: ActivityType;
    description: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.activityLog.create({
      data: {
        userId: data.userId,
        activityType: data.activityType,
        description: data.description,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Get activities for a user
   */
  async getUserActivities(userId: string, limit?: number) {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all activities (admin only)
   */
  async getAllActivities(filters?: {
    userId?: string;
    activityType?: ActivityType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.activityType) {
      where.activityType = filters.activityType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [totalActivities, recentActivities, activityByType] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.activityLog.groupBy({
        by: ['activityType'],
        where,
        _count: {
          activityType: true,
        },
      }),
    ]);

    return {
      totalActivities,
      recentActivities,
      activityByType: activityByType.map((item) => ({
        activityType: item.activityType,
        count: item._count.activityType || 0,
      })),
    };
  }

  /**
   * Clean old activity logs (older than X days)
   */
  async cleanOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

export default new ActivityLogService();
