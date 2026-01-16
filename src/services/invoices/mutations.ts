/**
 * Invoice Mutations
 * Create, update, delete operations
 */

import { prisma } from '../../lib/prisma';
import NotificationService from '../NotificationService';

export class InvoiceMutations {
  static async createSubscriptionInvoice(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) throw new Error('Subscription not found');

    const invoiceCount = await prisma.invoice.count({ where: { userId: subscription.userId } });
    const invoiceNumber = `INV-${Date.now()}-${String(invoiceCount + 1).padStart(3, '0')}`;
    
    const defaultPaymentMethod = await prisma.paymentMethod.findFirst({
      where: { userId: subscription.userId, isDefault: true },
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        transactionType: 'SUBSCRIPTION_RENEWAL',
        subtotal: subscription.priceAmount,
        tax: 0,
        total: subscription.priceAmount,
        currency: subscription.currency,
        status: 'UNPAID',
        invoiceDate: new Date(),
        dueDate: subscription.nextBillingDate || new Date(),
        paymentMethodId: defaultPaymentMethod?.id,
      },
    });

    await NotificationService.createNotification({
      userId: subscription.userId,
      type: 'INFO',
      title: 'New Invoice Generated',
      message: `Invoice ${invoiceNumber} for $${(Number(subscription.priceAmount) / 100).toFixed(2)}`,
      actionUrl: `/billing/invoices/${invoice.id}`,
      actionLabel: 'View Invoice',
    });

    return invoice;
  }

  static async createExtraHoursInvoice(userId: string, hours: number, pricePerHour: number, paymentMethodId?: string) {
    const amount = hours * pricePerHour;
    const invoiceCount = await prisma.invoice.count({ where: { userId } });
    const invoiceNumber = `INV-${Date.now()}-${String(invoiceCount + 1).padStart(3, '0')}`;

    let finalPaymentMethodId = paymentMethodId;
    if (!finalPaymentMethodId) {
      const defaultPaymentMethod = await prisma.paymentMethod.findFirst({
        where: { userId, isDefault: true },
      });
      finalPaymentMethodId = defaultPaymentMethod?.id;
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        transactionType: 'ADDITIONAL_HOURS',
        subtotal: amount,
        tax: 0,
        total: amount,
        hoursPurchased: hours,
        currency: 'USD',
        status: 'UNPAID',
        invoiceDate: new Date(),
        dueDate: new Date(),
        description: `${hours} extra hours @ $${pricePerHour}/hr`,
        paymentMethodId: finalPaymentMethodId,
      },
    });

    await NotificationService.createNotification({
      userId,
      type: 'INFO',
      title: 'Extra Hours Invoice',
      message: `Invoice for ${hours} extra hours ($${amount.toFixed(2)})`,
      actionUrl: `/billing/invoices/${invoice.id}`,
      actionLabel: 'Pay Now',
    });

    return invoice;
  }

  static async markAsPaid(invoiceId: string, paymentDetails?: { stripePaymentId?: string; paidAt?: Date }) {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: paymentDetails?.paidAt || new Date(),
        stripePaymentIntentId: paymentDetails?.stripePaymentId,
      },
      include: { subscription: true },
    });

    if (invoice.transactionType === 'SUBSCRIPTION_RENEWAL' && invoice.subscriptionId) {
      await prisma.subscription.update({
        where: { id: invoice.subscriptionId },
        data: {
          status: 'ACTIVE',
          nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        },
      });
    }

    await NotificationService.createNotification({
      userId: invoice.userId,
      type: 'SUCCESS',
      title: 'Payment Received',
      message: `Payment of $${Number(invoice.total).toFixed(2)} processed successfully`,
      actionUrl: `/billing/invoices/${invoice.id}`,
      actionLabel: 'View Receipt',
    });

    return invoice;
  }

  static async markAsFailed(invoiceId: string, reason?: string) {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'FAILED',
        ...(reason && { description: `Failed: ${reason}` }),
      },
    });

    await NotificationService.createNotification({
      userId: invoice.userId,
      type: 'ERROR',
      title: 'Payment Failed',
      message: reason || 'Your payment could not be processed',
      actionUrl: `/billing/invoices/${invoice.id}`,
      actionLabel: 'Retry Payment',
    });

    return invoice;
  }

  static async cancelInvoice(invoiceId: string, clientId?: string) {
    if (clientId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { userId: true, status: true },
      });

      if (!invoice || invoice.userId !== clientId) throw new Error('Unauthorized');
      if (invoice.status === 'PAID') throw new Error('Cannot cancel paid invoice');
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
    });
  }
}
