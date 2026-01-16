/**
 * Invoice Service
 * Orchestrates invoice operations
 */

import { PaymentStatus } from '@prisma/client';
import { InvoiceQueries } from './invoices/queries';
import { InvoiceMutations } from './invoices/mutations';

export class InvoiceService {
  async getClientInvoices(clientId: string, status?: PaymentStatus) {
    return InvoiceQueries.getClientInvoices(clientId, status);
  }

  async getInvoiceById(invoiceId: string, clientId?: string) {
    return InvoiceQueries.getInvoiceById(invoiceId, clientId);
  }

  async createSubscriptionInvoice(subscriptionId: string) {
    return InvoiceMutations.createSubscriptionInvoice(subscriptionId);
  }

  async createExtraHoursInvoice(userId: string, hours: number, pricePerHour: number, paymentMethodId?: string) {
    return InvoiceMutations.createExtraHoursInvoice(userId, hours, pricePerHour, paymentMethodId);
  }

  async markInvoiceAsPaid(invoiceId: string, paymentDetails?: { stripePaymentId?: string; paidAt?: Date }) {
    return InvoiceMutations.markAsPaid(invoiceId, paymentDetails);
  }

  async markInvoiceAsFailed(invoiceId: string, reason?: string) {
    return InvoiceMutations.markAsFailed(invoiceId, reason);
  }

  async cancelInvoice(invoiceId: string, clientId?: string) {
    return InvoiceMutations.cancelInvoice(invoiceId, clientId);
  }

  async getBillingSummary(clientId: string) {
    return InvoiceQueries.getBillingSummary(clientId);
  }

  async getPaymentHistory(clientId: string, startDate?: Date, endDate?: Date, limit?: number) {
    return InvoiceQueries.getPaymentHistory(clientId, startDate, endDate, limit);
  }

  async generateInvoicePDF(invoiceId: string) {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    return {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt,
      dueDate: invoice.dueDate,
      amount: Number(invoice.total),
      status: invoice.status,
      client: {
        name: invoice.user?.fullName || 'N/A',
        company: invoice.user?.companyName || 'N/A',
        email: invoice.user?.email || 'N/A',
      },
      items: [
        {
          description:
            invoice.transactionType === 'SUBSCRIPTION_RENEWAL'
              ? `${invoice.subscription?.plan} Plan - ${invoice.subscription?.monthlyHours} hours`
              : invoice.description,
          amount: Number(invoice.total),
        },
      ],
    };
  }
}

export default new InvoiceService();
