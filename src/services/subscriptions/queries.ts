/**
 * Subscription Queries
 * Read operations for subscriptions
 */

import { prisma } from '../../lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionQueries {
  static async getActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getUserSubscriptions(userId: string, status?: SubscriptionStatus) {
    return prisma.subscription.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getSubscriptionById(subscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: { select: { email: true, fullName: true } },
      },
    });
  }
}
