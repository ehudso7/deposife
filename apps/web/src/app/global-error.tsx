'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-600 to-orange-600">
                500
              </h1>
            </div>

            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Critical Error
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A critical error occurred. Our team has been notified and is working on a fix.
            </p>

            <div className="mt-10">
              <a
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg transition-all duration-200"
              >
                Return to Homepage
              </a>
            </div>

            {error.digest && (
              <div className="mt-8 text-xs text-gray-500">
                Error ID: {error.digest}
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                If you continue to experience issues, please contact{' '}
                <a
                  href="mailto:support@deposife.com"
                  className="text-red-600 hover:text-red-700"
                >
                  support@deposife.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}