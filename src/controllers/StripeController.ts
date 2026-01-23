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
    const userId = req.userId;
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

      // Use StripeService.savePaymentMethod to properly extract PaymentMethod ID from SetupIntent
      await StripeService.savePaymentMethod(userId, setupIntentId);

      // Return the saved payment method
      const paymentMethods = await PaymentMethodService.getUserPaymentMethods(userId);
      const savedMethod = paymentMethods[0]; // Most recent (should be default)

      return ApiResponse.success(res, savedMethod, 201);
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

  static async subscribe(req: AuthRequest, res: Response) {
    try {
      const userId = this.getUserId(req, res);
      if (!userId) return;

      const { plan } = req.body;
      if (!plan) {
        return ApiResponse.badRequest(res, 'Plan is required');
      }

      // Validate plan
      const validPlans = ['STARTER', 'GROWTH', 'ENTERPRISE'];
      if (!validPlans.includes(plan)) {
        return ApiResponse.badRequest(res, 'Invalid plan. Must be STARTER, GROWTH, or ENTERPRISE');
      }

      // Check if user already has an active subscription
      const { prisma } = await import('../lib/prisma');
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
        },
      });

      if (existingSubscription) {
        return ApiResponse.badRequest(res, 'You already have an active subscription');
      }

      // Activate subscription using StripeService
      logger.info(`Activating ${plan} subscription for user ${userId}`);
      const result = await StripeService.activateSubscription(userId, plan);

      return ApiResponse.success(res, {
        message: 'Subscription activated successfully',
        subscriptionId: result.subscriptionId,
        invoiceId: result.invoiceId,
      }, 201);
    } catch (error: any) {
      logger.error('Subscribe failed', error);
      
      // Handle specific error cases
      if (error.message.includes('no payment method')) {
        return ApiResponse.badRequest(res, 'Please add a payment method before subscribing');
      }
      
      if (error.message.includes('Enterprise plan requires custom pricing')) {
        return ApiResponse.badRequest(res, 'Enterprise plan requires a strategy call. Please contact your account manager.');
      }

      return ApiResponse.error(res, error.message || 'Failed to activate subscription');
    }
  }
}

export default StripeController;
