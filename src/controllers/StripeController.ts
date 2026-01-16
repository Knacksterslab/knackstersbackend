/**
 * Stripe Controller
 * Handles Stripe API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { StripeService } from '../services/StripeService';
import PaymentMethodService from '../services/PaymentMethodService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class StripeController {
  private static getUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.session?.userId;
    if (!userId) {
      ApiResponse.unauthorized(res);
      return null;
    }
    return userId;
  }

  static async createSetupIntent(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const setupIntent = await StripeService.createSetupIntent(userId);
      return ApiResponse.success(res, { clientSecret: setupIntent.client_secret });
    } catch (error: any) {
      logger.error('createSetupIntent failed', error);
      return ApiResponse.error(res, error.message || 'Failed to create setup intent');
    }
  }

  static async confirmPaymentMethod(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { setupIntentId } = req.body;
      if (!setupIntentId) return ApiResponse.badRequest(res, 'setupIntentId is required');

      const paymentMethod = await PaymentMethodService.addPaymentMethod({
        userId,
        stripePaymentMethodId: setupIntentId,
        type: 'CARD',
        cardBrand: 'VISA',
        cardLastFour: '0000',
        cardExpMonth: 12,
        cardExpYear: 2025,
        isDefault: true,
      });
      return ApiResponse.success(res, paymentMethod, 201);
    } catch (error: any) {
      logger.error('confirmPaymentMethod failed', error);
      return ApiResponse.error(res, error.message || 'Failed to save payment method');
    }
  }

  static async getPaymentMethods(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const paymentMethods = await PaymentMethodService.getUserPaymentMethods(userId);
      return ApiResponse.success(res, { paymentMethods });
    } catch (error: any) {
      logger.error('getPaymentMethods failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch payment methods');
    }
  }

  static async setDefaultPaymentMethod(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const paymentMethod = await PaymentMethodService.setDefaultPaymentMethod(req.params.paymentMethodId, userId);
      return ApiResponse.success(res, paymentMethod);
    } catch (error: any) {
      logger.error('setDefaultPaymentMethod failed', error);
      return ApiResponse.error(res, error.message || 'Failed to set default payment method');
    }
  }

  static async deletePaymentMethod(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      await PaymentMethodService.deletePaymentMethod(req.params.paymentMethodId);
      return ApiResponse.success(res, { message: 'Payment method deleted' });
    } catch (error: any) {
      logger.error('deletePaymentMethod failed', error);
      return ApiResponse.error(res, error.message || 'Failed to delete payment method');
    }
  }
}

export default StripeController;
