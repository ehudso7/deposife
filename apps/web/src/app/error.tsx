'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-br from-red-400 to-orange-400 rounded-full opacity-20 blur-3xl"></div>
            </div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
          Something went wrong!
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          We're sorry, but something unexpected happened. Our team has been notified and we're working on fixing it.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Try again
          </button>

          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
          >
            <Home className="mr-2 h-5 w-5" />
            Go to Homepage
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            If this problem persists, please contact our support team
          </p>
          <a
            href="mailto:support@deposife.com"
            className="inline-flex items-center text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
          >
            <Mail className="mr-2 h-4 w-4" />
            support@deposife.com
          </a>
        </div>

        {error.digest && (
          <div className="mt-6 text-xs text-gray-500">
            Error Reference: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}