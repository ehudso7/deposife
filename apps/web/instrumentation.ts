// This file registers the instrumentation.ts file.
// This allows for server-side Sentry instrumentation.
// See: https://docs.sentry.io/platforms/javascript/guides/nextjs/

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}