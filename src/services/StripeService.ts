import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { PLAN_CONFIG } from './subscriptions/config';

const prisma = new PrismaClient();

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
   * Charge customer and activate subscription (called by manager)
   */
  static async activateSubscription(
    userId: string,
    plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE',
    customPriceAmount?: number
  ): Promise<{ subscriptionId: string; invoiceId: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        paymentMethods: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.stripeCustomerId) {
      throw new Error('User has no Stripe customer ID');
    }

    const paymentMethod = user.paymentMethods[0];
    if (!paymentMethod) {
      throw new Error('User has no payment method on file');
    }

    // Determine pricing based on plan
    let priceAmount: number;
    let monthlyHours: number;

    if (customPriceAmount) {
      priceAmount = customPriceAmount;
      monthlyHours = 0; // Enterprise custom
    } else {
      const planConfig = PLAN_CONFIG[plan];
      if (!planConfig) {
        throw new Error('Invalid plan');
      }
      if (plan === 'ENTERPRISE') {
        throw new Error('Enterprise plan requires custom pricing');
      }
      priceAmount = planConfig.monthlyPrice;
      monthlyHours = planConfig.monthlyHours;
    }

    // Charge the customer
    logger.info(`Creating payment intent for ${plan} plan: $${priceAmount / 100} (${priceAmount} cents)`);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceAmount, // Already in cents from config
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: paymentMethod.stripePaymentMethodId!,
      confirm: true,
      off_session: true, // Allow charging saved payment method without customer present
      description: `${plan} Plan - First Month`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
    });

    logger.info(`Payment intent created: ${paymentIntent.id}, status: ${paymentIntent.status}`);

    // Handle payment intent status
    if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_payment_method') {
      logger.warn(`Payment requires additional action: ${paymentIntent.status}`);
      throw new Error('Payment requires additional authentication. Please try again or use a different payment method.');
    }

    if (paymentIntent.status === 'processing') {
      logger.info('Payment is processing...');
      // For processing status, we'll still create the subscription but mark it appropriately
    }

    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
      logger.error(`Payment failed with status: ${paymentIntent.status}`);
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

    // Create subscription in database
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: userId,
        plan: plan,
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        priceAmount: priceAmount,
        currency: 'USD',
        monthlyHours: monthlyHours,
        startDate: today,
        currentPeriodStart: today,
        currentPeriodEnd: nextMonth,
        nextBillingDate: nextMonth,
      },
    });

    // Create invoice record
    const invoiceNumber = `INV-${Date.now()}-${user.id.slice(0, 8)}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber,
        userId: userId,
        subscriptionId: subscription.id,
        transactionType: 'SUBSCRIPTION_RENEWAL',
        description: `${plan} Plan - First Month`,
        subtotal: priceAmount,
        tax: 0,
        total: priceAmount,
        status: 'PAID',
        invoiceDate: today,
        dueDate: today,
        paidAt: new Date(),
        paymentMethodId: paymentMethod.id,
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    // Create initial hours balance
    if (monthlyHours > 0) {
      await prisma.hoursBalance.create({
        data: {
          userId: userId,
          subscriptionId: subscription.id,
          periodStart: today,
          periodEnd: nextMonth,
          allocatedHours: monthlyHours,
          hoursUsed: 0,
        },
      });
    }

    return {
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
    };
  }
}
