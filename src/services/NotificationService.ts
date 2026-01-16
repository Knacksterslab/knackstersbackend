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
