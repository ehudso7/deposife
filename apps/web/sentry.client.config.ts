// This file configures the initialization of Sentry on the browser/client side.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // You can remove this option if you're not planning to use the Sentry Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional SDK configuration goes in here, for example:
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Configure how Sentry handles errors
  beforeSend(event) {
    // Filter out development-only errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },

  // Configure which environments to enable Sentry in
  environment: process.env.NODE_ENV || 'development',
});