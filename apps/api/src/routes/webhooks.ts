import { Router } from 'express';
import express from 'express';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export const webhookRouter = Router();

// Stripe webhook
webhookRouter.post('/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      // TODO: Verify webhook signature and process Stripe events

      logger.info('Stripe webhook received');

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
);

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