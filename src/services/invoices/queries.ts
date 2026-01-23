/**
 * Invoice Queries
 * All read operations for invoices
 */

import { prisma } from '../../lib/prisma';
import { PaymentStatus, Prisma } from '@prisma/client';

export class InvoiceQueries {
  static async getClientInvoices(clientId: string, status?: PaymentStatus) {
    const where: Prisma.InvoiceWhereInput = {
      userId: clientId,
      ...(status && { status }),
    };

    return prisma.invoice.findMany({
      where,
      include: {
        subscription: { select: { id: true, plan: true, monthlyHours: true } },
        paymentMethod: { select: { id: true, type: true, cardLastFour: true, cardBrand: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getInvoiceById(invoiceId: string, clientId?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: { select: { id: true, plan: true, monthlyHours: true, priceAmount: true } },
        paymentMethod: { select: { id: true, type: true, cardLastFour: true, cardBrand: true, cardExpMonth: true, cardExpYear: true } },
        user: { select: { id: true, email: true, fullName: true, companyName: true } },
      },
    });

    if (invoice && clientId && invoice.userId !== clientId) {
      throw new Error('Unauthorized access to invoice');
    }

    return invoice;
  }

  static async getBillingSummary(clientId: string) {
    const [totalPaid, totalPending, totalFailed, recentInvoices] = await Promise.all([
      prisma.invoice.aggregate({ where: { userId: clientId, status: 'PAID' }, _sum: { total: true } }),
      prisma.invoice.aggregate({ where: { userId: clientId, status: 'UNPAID' }, _sum: { total: true } }),
      prisma.invoice.count({ where: { userId: clientId, status: 'FAILED' } }),
      prisma.invoice.findMany({
        where: { userId: clientId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { paymentMethod: { select: { type: true, cardLastFour: true, cardBrand: true } } },
      }),
    ]);

    return {
      totalPaid: Number(totalPaid._sum?.total || 0) / 100, // Convert cents to dollars
      totalPending: Number(totalPending._sum?.total || 0) / 100, // Convert cents to dollars
      totalFailed,
      recentInvoices,
    };
  }

  static async getPaymentHistory(clientId: string, startDate?: Date, endDate?: Date, limit?: number) {
    return prisma.invoice.findMany({
      where: {
        userId: clientId,
        status: 'PAID',
        ...(startDate && endDate && { paidAt: { gte: startDate, lte: endDate } }),
      },
      include: {
        subscription: { select: { plan: true } },
        paymentMethod: { select: { type: true, cardLastFour: true, cardBrand: true } },
      },
      orderBy: { paidAt: 'desc' },
      take: limit,
    });
  }
}
