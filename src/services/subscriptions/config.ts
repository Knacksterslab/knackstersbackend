/**
 * Subscription Configuration
 * Plan pricing and configuration (DRY)
 * Must match frontend lib/config/plans.ts
 */

export const PLAN_CONFIG = {
  TRIAL: {
    monthlyPrice: 0, // Free
    yearlyPrice: 0,
    monthlyHours: 50,
    isFree: true,
    trialOnly: true, // One per company, one domain, 30-day validity
  },
  FLEX_RETAINER: {
    onboardingPrice: 350000,  // $3,500 in cents — first month only
    monthlyPrice: 700000,     // $7,000 in cents — ongoing standard rate
    yearlyPrice: 7000000,     // $70,000 in cents
    monthlyHours: 100,
    isFree: false,
    trialOnly: false,
  },
  PRO_RETAINER: {
    monthlyPrice: 1250000, // $12,500 in cents
    yearlyPrice: 12500000, // $125,000 in cents
    monthlyHours: 200,
    isFree: false,
    trialOnly: false,
  },
  GROWTH: {
    monthlyPrice: 2500000, // $25,000 in cents
    yearlyPrice: 25000000, // $250,000 in cents
    monthlyHours: 450,
    isFree: false,
    trialOnly: false,
  },
  ENTERPRISE: {
    monthlyPrice: 0, // Custom pricing
    yearlyPrice: 0,
    monthlyHours: 0, // Custom hours
    isFree: false,
    trialOnly: false,
  },
  CUSTOM: {
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyHours: 0,
    isFree: false,
    trialOnly: false,
  },
};

export type PlanType = keyof typeof PLAN_CONFIG;
