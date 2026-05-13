import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { PLAN_CONFIG } from './subscriptions/config';
import { SubscriptionMutations } from './subscriptions/mutations';

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('STRIPE_SECRET_KEY not set - Add to backend/.env');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_startup', {
  apiVersion: '2025-12-15.clover',
});

export class StripeService {
  /**
   * Create or get Stripe customer for user
   */
  static async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, stripeCustomerId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Return existing customer ID if available
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName || undefined,
      metadata: {
        userId: user.id,
      },
    });

    // Save customer ID to database
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create Setup Intent for collecting payment method
   */
  static async createSetupIntent(userId: string): Promise<Stripe.SetupIntent> {
    const customerId = await this.getOrCreateCustomer(userId);

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        userId: userId,
      },
    });

    return setupIntent;
  }

  /**
   * Save payment method to database after successful setup
   */
  static async savePaymentMethod(
    userId: string,
    setupIntentId: string
  ): Promise<void> {
    // Retrieve the setup intent to get payment method details
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      throw new Error('Setup intent not succeeded');
    }

    const paymentMethodId = setupIntent.payment_method as string;
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Check if payment method already exists
    const existingPaymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId: userId,
        stripePaymentMethodId: paymentMethodId,
      },
    });

    if (existingPaymentMethod) {
      return; // Already saved
    }

    // Set all other payment methods to non-default
    await prisma.paymentMethod.updateMany({
      where: { userId: userId },
      data: { isDefault: false },
    });

    // Save new payment method
    await prisma.paymentMethod.create({
      data: {
        userId: userId,
        type: 'CARD',
        isDefault: true,
        cardBrand: paymentMethod.card?.brand?.toUpperCase() as any,
        cardLastFour: paymentMethod.card?.last4 || null,
        cardExpMonth: paymentMethod.card?.exp_month || null,
        cardExpYear: paymentMethod.card?.exp_year || null,
        stripePaymentMethodId: paymentMethodId,
        billingEmail: paymentMethod.billing_details.email || null,
      },
    });
  }

  /**
   * Charge customer and activate subscription (called by manager or client self-serve).
   * For FLEX_RETAINER: charges the onboarding rate and stores the standard recurring rate.
   */
  static async activateSubscription(
    userId: string,
    plan: 'TRIAL' | 'FLEX_RETAINER' | 'PRO_RETAINER' | 'GROWTH' | 'ENTERPRISE',
    customPriceAmount?: number,
    trialDomain?: string
  ): Promise<{ subscriptionId: string; invoiceId: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { paymentMethods: { where: { isDefault: true }, take: 1 } },
    });

    if (!user) throw new Error('User not found');

    let priceAmount: number;
    let recurringPriceAmount: number | null = null;
    let monthlyHours: number;

    if (customPriceAmount) {
      priceAmount = customPriceAmount;
      monthlyHours = 0;
    } else {
      const planConfig = PLAN_CONFIG[plan];
      if (!planConfig) throw new Error('Invalid plan');
      if (plan === 'ENTERPRISE') throw new Error('Enterprise plan requires custom pricing');

      monthlyHours = planConfig.monthlyHours;

      if (plan === 'FLEX_RETAINER' && 'onboardingPrice' in planConfig) {
        priceAmount = planConfig.onboardingPrice;
        recurringPriceAmount = planConfig.monthlyPrice;
      } else {
        priceAmount = planConfig.monthlyPrice;
      }
    }

    let stripePaymentIntentId: string | undefined;

    if (plan !== 'TRIAL' && priceAmount > 0) {
      if (!user.stripeCustomerId) throw new Error('User has no Stripe customer ID');

      const paymentMethod = user.paymentMethods[0];
      if (!paymentMethod) throw new Error('User has no payment method on file');

      const description = plan === 'FLEX_RETAINER'
        ? 'Flex Retainer — Onboarding Period'
        : `${plan} Plan — First Month`;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceAmount,
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: paymentMethod.stripePaymentMethodId!,
        confirm: true,
        off_session: true,
        description,
        metadata: { userId: user.id, plan },
      });

      if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_payment_method') {
        throw new Error('Payment requires additional authentication. Please use a different payment method.');
      }
      if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }

      stripePaymentIntentId = paymentIntent.id;
    }

    return SubscriptionMutations.createSubscriptionWithInvoice({
      userId,
      plan: plan as any,
      priceAmount,
      recurringPriceAmount,
      monthlyHours,
      trialDomain,
      stripePaymentIntentId,
      paymentMethodId: user.paymentMethods[0]?.id ?? null,
    });
  }
}
