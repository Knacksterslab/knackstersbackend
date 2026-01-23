/**
 * Subscription Configuration
 * Plan pricing and configuration (DRY)
 */

export const PLAN_CONFIG = {
  STARTER: {
    monthlyPrice: 1250000, // $12,500 in cents
    yearlyPrice: 12500000, // $125,000 in cents
    monthlyHours: 200,
  },
  GROWTH: {
    monthlyPrice: 2500000, // $25,000 in cents
    yearlyPrice: 25000000, // $250,000 in cents
    monthlyHours: 450,
  },
  ENTERPRISE: {
    monthlyPrice: 0, // Custom pricing
    yearlyPrice: 0,
    monthlyHours: 0, // Custom hours
  },
  CUSTOM: {
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyHours: 0,
  },
};

export type PlanType = keyof typeof PLAN_CONFIG;
