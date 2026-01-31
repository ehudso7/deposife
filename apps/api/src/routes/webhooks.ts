import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { DepositStatus, TransactionStatus, TransactionType } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const webhookRouter: ExpressRouter = Router();

// Stripe webhook
webhookRouter.post('/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      if (!sig || !endpointSecret) {
        logger.error('Missing Stripe webhook signature or secret');
        return res.status(400).json({ error: 'Missing webhook configuration' });
      }

      let event: Stripe.Event;

      try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          endpointSecret
        );
      } catch (err: any) {
        logger.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentSucceeded(paymentIntent);
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentFailed(failedPayment);
          break;

        case 'charge.succeeded':
          const charge = event.data.object as Stripe.Charge;
          await handleChargeSucceeded(charge);
          break;

        case 'charge.refunded':
          const refundedCharge = event.data.object as Stripe.Charge;
          await handleChargeRefunded(refundedCharge);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdate(subscription);
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(deletedSubscription);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentSucceeded(invoice);
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentFailed(failedInvoice);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      // Return a response to acknowledge receipt of the event
      res.json({ received: true, type: event.type });
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Helper functions for handling different event types
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`Payment succeeded: ${paymentIntent.id} for amount ${paymentIntent.amount}`);

  // Update deposit or transaction status
  if (paymentIntent.metadata.depositId) {
    await prisma.deposit.update({
      where: { id: paymentIntent.metadata.depositId },
      data: {
        status: DepositStatus.HELD,
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: new Date(),
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        depositId: paymentIntent.metadata.depositId,
        type: TransactionType.DEPOSIT_COLLECTION,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        description: `Deposit collection for payment intent ${paymentIntent.id}`,
        status: TransactionStatus.COMPLETED,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge as string,
        processedAt: new Date(),
        metadata: paymentIntent.metadata as any,
      },
    });

    // Send confirmation email
    // TODO: Implement email notification
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.error(`Payment failed: ${paymentIntent.id}`);

  if (paymentIntent.metadata.depositId) {
    // Update transaction status
    await prisma.transaction.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: TransactionStatus.FAILED,
        metadata: {
          error: paymentIntent.last_payment_error?.message || 'Payment failed',
        },
      },
    });

    // Send failure notification
    // TODO: Implement email notification
  }
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  logger.info(`Charge succeeded: ${charge.id} for amount ${charge.amount}`);

  // Update transaction with charge details
  if (charge.payment_intent) {
    await prisma.transaction.updateMany({
      where: { stripePaymentIntentId: charge.payment_intent as string },
      data: {
        stripeChargeId: charge.id,
        processingFee: (charge.balance_transaction as any)?.fee || 0,
      },
    });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.info(`Charge refunded: ${charge.id} for amount ${charge.amount_refunded}`);

  if (charge.payment_intent) {
    // Create refund transaction
    const originalTransaction = await prisma.transaction.findFirst({
      where: { stripeChargeId: charge.id },
    });

    if (originalTransaction) {
      await prisma.transaction.create({
        data: {
          depositId: originalTransaction.depositId,
          type: TransactionType.DEPOSIT_RETURN,
          amount: charge.amount_refunded / 100,
          currency: charge.currency.toUpperCase(),
          description: `Deposit refund for charge ${charge.id}`,
          status: TransactionStatus.COMPLETED,
          stripeChargeId: charge.id,
          stripeRefundId: charge.refunds?.data[0]?.id,
          processedAt: new Date(),
        },
      });

      // Update deposit status if fully refunded
      if (charge.amount === charge.amount_refunded) {
        if (originalTransaction.depositId) {
          await prisma.deposit.update({
            where: { id: originalTransaction.depositId },
          data: {
            status: DepositStatus.RETURNED,
            returnedAt: new Date(),
          },
        });
        }
      }
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  logger.info(`Subscription updated: ${subscription.id}`);

  // Update user subscription status
  if (subscription.metadata.userId) {
    await prisma.user.update({
      where: { id: subscription.metadata.userId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionEndDate: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        updatedAt: new Date(),
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info(`Subscription deleted: ${subscription.id}`);

  // Update user subscription status
  if (subscription.metadata.userId) {
    await prisma.user.update({
      where: { id: subscription.metadata.userId },
      data: {
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info(`Invoice payment succeeded: ${invoice.id}`);

  // Update subscription and create transaction record
  if (invoice.subscription && invoice.customer) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (user) {
      await prisma.transaction.create({
        data: {
          type: TransactionType.SUBSCRIPTION_PAYMENT,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          description: `Subscription payment for invoice ${invoice.id}`,
          status: TransactionStatus.COMPLETED,
          stripeInvoiceId: invoice.id,
          stripeChargeId: invoice.charge as string,
          processedAt: new Date(),
          metadata: {
            subscriptionId: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id,
            period: {
              start: invoice.period_start,
              end: invoice.period_end,
            },
          },
        },
      });
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.error(`Invoice payment failed: ${invoice.id}`);

  // Update user subscription status
  if (invoice.customer) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'past_due',
          updatedAt: new Date(),
        },
      });

      // Send payment failure notification
      // TODO: Implement email notification
    }
  }
}

// SendGrid webhook
webhookRouter.post('/sendgrid',
  express.json(),
  async (req, res, next) => {
    try {
      const events = req.body;

      // Process SendGrid events
      for (const event of events) {
        logger.info(`SendGrid event: ${event.event} for ${event.email}`);

        // TODO: Update email status in database based on events
      }

      res.status(200).send();
    } catch (error) {
      logger.error('SendGrid webhook failed:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
);