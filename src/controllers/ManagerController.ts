/**
 * Manager Controller
 * Handles manager API requests
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { StripeService } from '../services/StripeService';
import ManagerService from '../services/ManagerService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { Validators } from '../utils/validation';
import { prisma } from '../lib/prisma';

export class ManagerController {
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const dashboard = await ManagerService.getDashboardOverview(managerId);
      return ApiResponse.success(res, dashboard);
    } catch (error: any) {
      logger.error('getDashboard failed', error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getClients(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const clients = await prisma.user.findMany({
        where: { accountManagerId: managerId, role: 'CLIENT' },
      });
      return ApiResponse.success(res, clients);
    } catch (error: any) {
      logger.error('getClients failed', error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getProjects(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const projects = await ManagerService.getManagerProjects(managerId);
      return ApiResponse.success(res, projects);
    } catch (error: any) {
      logger.error('getProjects failed', error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getTasks(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const tasks = await ManagerService.getManagerTasks(managerId);
      return ApiResponse.success(res, tasks);
    } catch (error: any) {
      logger.error('getTasks failed', error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const stats = await ManagerService.getManagerStats(managerId);
      return ApiResponse.success(res, stats);
    } catch (error: any) {
      logger.error('getStats failed', error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getAvailableTalent(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const talent = await ManagerService.getAvailableTalent();
      return ApiResponse.success(res, talent);
    } catch (error: any) {
      logger.error('getAvailableTalent failed', error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getPendingOnboardingClients(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const pendingClients = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
          accountManagerId: managerId,
          paymentMethods: { some: {} },
          subscriptions: { none: { status: 'ACTIVE' } },
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          companyName: true,
          phone: true,
          createdAt: true,
          paymentMethods: { where: { isDefault: true }, select: { cardBrand: true, cardLastFour: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return ApiResponse.success(res, { clients: pendingClients });
    } catch (error: any) {
      logger.error('getPendingOnboardingClients failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch pending clients');
    }
  }

  static async activateClientSubscription(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const { userId, plan, customPriceAmount } = req.body;

      const validation = Validators.requireFields(req.body, ['userId', 'plan']);
      if (!validation.valid) {
        return ApiResponse.badRequest(res, `Missing fields: ${validation.missing.join(', ')}`);
      }

      if (!['STARTER', 'GROWTH', 'ENTERPRISE'].includes(plan)) {
        return ApiResponse.badRequest(res, 'Invalid plan');
      }

      if (plan === 'ENTERPRISE' && !customPriceAmount) {
        return ApiResponse.badRequest(res, 'Custom price required for Enterprise plan');
      }

      const client = await prisma.user.findUnique({ where: { id: userId }, select: { accountManagerId: true } });
      if (!client || client.accountManagerId !== managerId) {
        return ApiResponse.forbidden(res, 'Not authorized to activate this client');
      }

      const result = await StripeService.activateSubscription(userId, plan, customPriceAmount);

      await prisma.activityLog.create({
        data: {
          userId,
          activityType: 'INVOICE_PAID',
          description: `Subscription activated: ${plan} plan`,
          metadata: { subscriptionId: result.subscriptionId, invoiceId: result.invoiceId, managerId, plan },
        },
      });

      return ApiResponse.success(res, {
        message: 'Subscription activated successfully',
        subscriptionId: result.subscriptionId,
        invoiceId: result.invoiceId,
      });
    } catch (error: any) {
      logger.error('activateClientSubscription failed', error);
      return ApiResponse.error(res, error.message || 'Failed to activate subscription');
    }
  }

  static async getClientDetails(req: AuthRequest, res: Response) {
    try {
      const managerId = req.session?.userId;
      if (!managerId) return ApiResponse.unauthorized(res);

      const client = await prisma.user.findUnique({
        where: { id: req.params.userId },
        include: {
          paymentMethods: { where: { isDefault: true }, select: { cardBrand: true, cardLastFour: true, cardExpMonth: true, cardExpYear: true } },
          subscriptions: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (!client) return ApiResponse.notFound(res, 'Client');
      if (client.accountManagerId !== managerId) return ApiResponse.forbidden(res, 'Not authorized to view this client');

      return ApiResponse.success(res, {
        client: {
          id: client.id,
          email: client.email,
          fullName: client.fullName,
          companyName: client.companyName,
          phone: client.phone,
          createdAt: client.createdAt,
          hasPaymentMethod: client.paymentMethods.length > 0,
          paymentMethod: client.paymentMethods[0] || null,
          hasActiveSubscription: client.subscriptions.length > 0,
          subscription: client.subscriptions[0] || null,
        },
      });
    } catch (error: any) {
      logger.error('getClientDetails failed', error);
      return ApiResponse.error(res, error.message || 'Failed to fetch client details');
    }
  }
}
