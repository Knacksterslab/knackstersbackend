/**
 * Notification Service
 * Handles user notifications
 */

import { prisma } from '../lib/prisma';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  }) {
    // Check for duplicate notification within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    // If duplicate found, return existing notification instead of creating new
    if (existingNotification) {
      return existingNotification;
    }

    return prisma.notification.create({ data });
  }

  async getUserNotifications(userId: string, limit = 20, unreadOnly = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(notificationId: string) {
    return prisma.notification.delete({ where: { id: notificationId } });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

export default new NotificationService();
