// This file configures the initialization of Sentry for edge features (middleware, edge API routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also applied to Node.js-based edge features.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Note: automaticVercelMonitors option removed in newer versions

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