/**
 * Subscription Mutations
 * Create, update operations
 */

import { prisma } from '../../lib/prisma';
import { SubscriptionPlan, BillingInterval } from '@prisma/client';
import NotificationService from '../NotificationService';

export class SubscriptionMutations {
  static async createSubscription(data: {
    userId: string;
    plan: SubscriptionPlan;
    billingInterval: BillingInterval;
    priceAmount: number;
    monthlyHours: number;
  }) {
    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    return prisma.subscription.create({
      data: {
        userId: data.userId,
        plan: data.plan,
        billingInterval: data.billingInterval,
        priceAmount: data.priceAmount,
        monthlyHours: data.monthlyHours,
        currency: 'USD',
        status: 'ACTIVE',
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: nextBillingDate,
        nextBillingDate,
      },
    });
  }

  static async updateSubscription(userId: string, updates: Partial<{
    plan: SubscriptionPlan;
    priceAmount: number;
    monthlyHours: number;
  }>) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!subscription) throw new Error('No active subscription found');

    return prisma.subscription.update({
      where: { id: subscription.id },
      data: updates,
    });
  }

  static async cancelSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!subscription) throw new Error('No active subscription to cancel');

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    await NotificationService.createNotification({
      userId,
      type: 'WARNING',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled',
      actionUrl: '/billing',
    });

    return updated;
  }

  static async pauseSubscription(subscriptionId: string) {
    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'PAUSED' },
    });
  }

  static async resumeSubscription(subscriptionId: string) {
    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
    });
  }
}
