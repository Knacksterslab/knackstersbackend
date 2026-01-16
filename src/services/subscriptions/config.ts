/**
 * Subscription Configuration
 * Plan pricing and configuration (DRY)
 */

export const PLAN_CONFIG = {
  STARTER: {
    monthlyPrice: 12500,
    yearlyPrice: 125000,
    monthlyHours: 200,
  },
  GROWTH: {
    monthlyPrice: 25000,
    yearlyPrice: 250000,
    monthlyHours: 450,
  },
  ENTERPRISE: {
    monthlyPrice: 50000,
    yearlyPrice: 500000,
    monthlyHours: 1200,
  },
  CUSTOM: {
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyHours: 0,
  },
};

export type PlanType = keyof typeof PLAN_CONFIG;
