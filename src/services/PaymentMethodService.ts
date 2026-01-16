/**
 * Payment Method Service
 * Manages payment methods for clients
 */

import { prisma } from '../lib/prisma';
import { PaymentMethodType } from '@prisma/client';

export class PaymentMethodService {
  /**
   * Get all payment methods for a user
   */
  async getUserPaymentMethods(userId: string) {
    return prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // Default first
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get default payment method
   */
  async getDefaultPaymentMethod(userId: string) {
    return prisma.paymentMethod.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  /**
   * Get payment method by ID
   */
  async getPaymentMethodById(paymentMethodId: string, userId?: string) {
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    // Verify ownership
    if (paymentMethod && userId && paymentMethod.userId !== userId) {
      throw new Error('Unauthorized access to payment method');
    }

    return paymentMethod;
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(data: {
    userId: string;
    type: PaymentMethodType;
    stripePaymentMethodId?: string;
    cardLastFour: string;
    cardBrand?: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER';
    cardExpMonth?: number;
    cardExpYear?: number;
    isDefault?: boolean;
  }) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: {
          userId: data.userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // If this is the first payment method, make it default
    const existingCount = await prisma.paymentMethod.count({
      where: { userId: data.userId },
    });

    return prisma.paymentMethod.create({
      data: {
        userId: data.userId,
        type: data.type,
        stripePaymentMethodId: data.stripePaymentMethodId,
        cardLastFour: data.cardLastFour,
        cardBrand: data.cardBrand,
        cardExpMonth: data.cardExpMonth,
        cardExpYear: data.cardExpYear,
        isDefault: data.isDefault || existingCount === 0,
      },
    });
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    data: {
      expiryMonth?: number;
      expiryYear?: number;
      isDefault?: boolean;
    },
    userId?: string
  ) {
    // Verify ownership
    if (userId) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
        select: { userId: true },
      });

      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw new Error('Unauthorized');
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
        select: { userId: true },
      });

      if (paymentMethod) {
        await prisma.paymentMethod.updateMany({
          where: {
            userId: paymentMethod.userId,
            isDefault: true,
            id: { not: paymentMethodId },
          },
          data: {
            isDefault: false,
          },
        });
      }
    }

    return prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data,
    });
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string, userId?: string) {
    // Verify ownership
    if (userId) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
        select: { userId: true, isDefault: true },
      });

      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw new Error('Unauthorized');
      }

      // Prevent deleting the only/default payment method if subscriptions exist
      if (paymentMethod.isDefault) {
        const otherMethods = await prisma.paymentMethod.count({
          where: {
            userId: paymentMethod.userId,
            id: { not: paymentMethodId },
          },
        });

        const activeSubscription = await prisma.subscription.findFirst({
          where: {
            userId: paymentMethod.userId,
            status: 'ACTIVE',
          },
        });

        if (activeSubscription && otherMethods === 0) {
          throw new Error('Cannot delete the only payment method with an active subscription');
        }

        // If deleting default and others exist, make another one default
        if (otherMethods > 0) {
          const nextMethod = await prisma.paymentMethod.findFirst({
            where: {
              userId: paymentMethod.userId,
              id: { not: paymentMethodId },
            },
            orderBy: { createdAt: 'desc' },
          });

          if (nextMethod) {
            await prisma.paymentMethod.update({
              where: { id: nextMethod.id },
              data: { isDefault: true },
            });
          }
        }
      }
    }

    return prisma.paymentMethod.delete({
      where: { id: paymentMethodId },
    });
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string, userId: string) {
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
      select: { userId: true },
    });

    if (!paymentMethod || paymentMethod.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Unset other defaults
    await prisma.paymentMethod.updateMany({
      where: {
        userId,
        isDefault: true,
        id: { not: paymentMethodId },
      },
      data: {
        isDefault: false,
      },
    });

    // Set as default
    return prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
    });
  }
}

export default new PaymentMethodService();
