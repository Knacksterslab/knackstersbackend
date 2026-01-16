/**
 * Billing Controller
 * Handles billing API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import InvoiceService from '../services/InvoiceService';
import SubscriptionService from '../services/SubscriptionService';
import { PaymentStatus } from '@prisma/client';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class BillingController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.session?.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async getBillingSummary(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const summary = await InvoiceService.getBillingSummary(userId);
      return ApiResponse.success(res, summary);
    } catch (error: any) {
      logger.error('getBillingSummary failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch billing summary');
    }
  }

  static async getInvoices(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const status = req.query.status as PaymentStatus | undefined;
      const invoices = await InvoiceService.getClientInvoices(userId, status);
      return ApiResponse.success(res, invoices);
    } catch (error: any) {
      logger.error('getInvoices failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch invoices');
    }
  }

  static async getInvoice(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const invoice = await InvoiceService.getInvoiceById(req.params.id, userId);
      if (!invoice) return ApiResponse.notFound(res, 'Invoice');

      return ApiResponse.success(res, invoice);
    } catch (error: any) {
      logger.error('getInvoice failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch invoice');
    }
  }

  static async getSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const subscription = await SubscriptionService.getActiveSubscription(userId);
      return ApiResponse.success(res, subscription);
    } catch (error: any) {
      logger.error('getSubscription failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch subscription');
    }
  }

  static async getPaymentHistory(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { startDate, endDate, limit } = req.query;
      const history = await InvoiceService.getPaymentHistory(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      return ApiResponse.success(res, history);
    } catch (error: any) {
      logger.error('getPaymentHistory failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch payment history');
    }
  }

  static async downloadInvoice(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const invoicePdf = await InvoiceService.generateInvoicePDF(req.params.id);
      return ApiResponse.success(res, invoicePdf);
    } catch (error: any) {
      logger.error('downloadInvoice failed', error);
      return ApiResponse.error(res, error.message || 'Failed to generate invoice PDF');
    }
  }

  static async upgradeSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { plan } = req.body;
      if (!plan) return ApiResponse.badRequest(res, 'Plan is required');

      const subscription = await SubscriptionService.updateSubscription(userId, { plan });
      return ApiResponse.success(res, subscription);
    } catch (error: any) {
      logger.error('upgradeSubscription failed', error);
      return ApiResponse.error(res, error.message || 'Failed to upgrade subscription');
    }
  }

  static async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const subscription = await SubscriptionService.cancelSubscription(userId);
      return ApiResponse.success(res, subscription);
    } catch (error: any) {
      logger.error('cancelSubscription failed', error);
      return ApiResponse.error(res, error.message || 'Failed to cancel subscription');
    }
  }

  static async purchaseExtraHours(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { hours, paymentMethodId } = req.body;
      if (!hours || hours <= 0) return ApiResponse.badRequest(res, 'Valid hours amount required');

      const pricePerHour = 75;
      const invoice = await InvoiceService.createExtraHoursInvoice(userId, hours, pricePerHour, paymentMethodId);
      return ApiResponse.success(res, invoice, 201);
    } catch (error: any) {
      logger.error('purchaseExtraHours failed', error);
      return ApiResponse.error(res, error.message || 'Failed to purchase extra hours');
    }
  }
}

export default BillingController;
