/**
 * Subscription Mutations
 * Create, update operations
 */

import { prisma } from '../../lib/prisma';
import { SubscriptionPlan, BillingInterval } from '@prisma/client';
import NotificationService from '../NotificationService';

export class SubscriptionMutations {
  /**
   * Atomically creates a subscription, first invoice, and hours balance.
   * Called by StripeService after a successful charge (or for free plans).
   */
  static async createSubscriptionWithInvoice(data: {
    userId: string;
    plan: SubscriptionPlan;
    priceAmount: number;
    recurringPriceAmount: number | null;
    monthlyHours: number;
    trialDomain?: string | null;
    stripePaymentIntentId?: string;
    paymentMethodId?: string | null;
  }): Promise<{ subscriptionId: string; invoiceId: string }> {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: data.userId,
        plan: data.plan,
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        priceAmount: data.priceAmount,
        recurringPriceAmount: data.recurringPriceAmount,
        currency: 'USD',
        monthlyHours: data.monthlyHours,
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        nextBillingDate: data.plan === 'TRIAL' ? null : nextMonth,
      },
    });

    if (data.plan === 'TRIAL' && data.trialDomain !== undefined) {
      await prisma.user.update({
        where: { id: data.userId },
        data: { trialUsed: true, trialDomain: data.trialDomain as any ?? null },
      });
    }

    const invoiceCount = await prisma.invoice.count({ where: { userId: data.userId } });
    const invoiceNumber = `INV-${Date.now()}-${String(invoiceCount + 1).padStart(3, '0')}`;
    const description = data.plan === 'TRIAL'
      ? 'Trial to Hire — Onboarding Period (50 hrs, 30 days)'
      : data.plan === 'FLEX_RETAINER'
        ? 'Flex Retainer — Onboarding Period (100 hrs)'
        : `${data.plan} Plan — First Month`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: data.userId,
        subscriptionId: subscription.id,
        transactionType: 'SUBSCRIPTION_RENEWAL',
        description,
        subtotal: data.priceAmount,
        tax: 0,
        total: data.priceAmount,
        status: 'PAID',
        invoiceDate: now,
        dueDate: now,
        paidAt: now,
        paymentMethodId: data.paymentMethodId ?? null,
        stripePaymentIntentId: data.stripePaymentIntentId ?? null,
        currency: 'USD',
      },
    });

    if (data.monthlyHours > 0) {
      await prisma.hoursBalance.create({
        data: {
          userId: data.userId,
          subscriptionId: subscription.id,
          periodStart: now,
          periodEnd: nextMonth,
          allocatedHours: data.monthlyHours,
          hoursUsed: 0,
        },
      });
    }

    return { subscriptionId: subscription.id, invoiceId: invoice.id };
  }

  static async updateSubscription(userId: string, updates: Partial<{
    plan: SubscriptionPlan;
    priceAmount: number;
    recurringPriceAmount: number | null;
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
