/**
 * Subscription Service
 * Orchestrates subscription operations
 */

import { SubscriptionPlan, BillingInterval, SubscriptionStatus } from '@prisma/client';
import { SubscriptionQueries } from './subscriptions/queries';
import { SubscriptionMutations } from './subscriptions/mutations';
import { PLAN_CONFIG, PlanType } from './subscriptions/config';

export class SubscriptionService {
  getPlanConfig(plan: SubscriptionPlan) {
    return PLAN_CONFIG[plan as PlanType] || PLAN_CONFIG.CUSTOM;
  }

  async getActiveSubscription(userId: string) {
    return SubscriptionQueries.getActiveSubscription(userId);
  }

  async getUserSubscriptions(userId: string, status?: SubscriptionStatus) {
    return SubscriptionQueries.getUserSubscriptions(userId, status);
  }

  async getSubscriptionById(subscriptionId: string) {
    return SubscriptionQueries.getSubscriptionById(subscriptionId);
  }

  async createSubscription(data: {
    userId: string;
    plan: SubscriptionPlan;
    billingInterval: BillingInterval;
    priceAmount: number;
    monthlyHours: number;
  }) {
    return SubscriptionMutations.createSubscription(data);
  }

  async updateSubscription(userId: string, updates: any) {
    return SubscriptionMutations.updateSubscription(userId, updates);
  }

  async cancelSubscription(userId: string) {
    return SubscriptionMutations.cancelSubscription(userId);
  }

  async pauseSubscription(subscriptionId: string) {
    return SubscriptionMutations.pauseSubscription(subscriptionId);
  }

  async resumeSubscription(subscriptionId: string) {
    return SubscriptionMutations.resumeSubscription(subscriptionId);
  }
}

export default new SubscriptionService();
