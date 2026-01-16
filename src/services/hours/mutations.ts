/**
 * Hours Balance Mutations
 * Create, update operations
 */

import { prisma } from '../../lib/prisma';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

export class HoursMutations {
  static async createMonthlyBalance(userId: string, subscriptionId: string, monthlyHours: number, startDate?: Date) {
    const periodStart = startDate || startOfMonth(new Date());
    const periodEnd = endOfMonth(periodStart);

    return prisma.hoursBalance.create({
      data: {
        userId,
        subscriptionId,
        periodStart,
        periodEnd,
        allocatedHours: monthlyHours,
        hoursUsed: 0,
      },
    });
  }

  static async addPurchasedHours(userId: string, hours: number) {
    const balance = await prisma.hoursBalance.findFirst({
      where: {
        userId,
        periodEnd: { gte: new Date() },
      },
    });

    if (!balance) throw new Error('No active hours balance found');

    return prisma.hoursBalance.update({
      where: { id: balance.id },
      data: {
        extraPurchasedHours: balance.extraPurchasedHours + hours,
      },
    });
  }

  static async updateUsage(balanceId: string, minutesUsed: number) {
    const balance = await prisma.hoursBalance.findUnique({ where: { id: balanceId } });
    if (!balance) throw new Error('Hours balance not found');

    const hoursUsed = Number(balance.hoursUsed) + minutesUsed / 60;

    return prisma.hoursBalance.update({
      where: { id: balanceId },
      data: { hoursUsed },
    });
  }

  static async resetMonthlyBalance(userId: string) {
    const currentBalance = await prisma.hoursBalance.findFirst({
      where: {
        userId,
        periodEnd: { gte: new Date() },
      },
      include: { subscription: true },
    });

    if (!currentBalance?.subscription) return null;

    const nextPeriodStart = addMonths(currentBalance.periodStart, 1);
    const nextPeriodEnd = endOfMonth(nextPeriodStart);

    return prisma.hoursBalance.create({
      data: {
        userId,
        subscriptionId: currentBalance.subscriptionId!,
        periodStart: nextPeriodStart,
        periodEnd: nextPeriodEnd,
        allocatedHours: currentBalance.subscription.monthlyHours,
        hoursUsed: 0,
      },
    });
  }
}
