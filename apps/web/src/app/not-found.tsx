'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl"></div>
            </div>
            <div className="relative">
              <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-pink-600">
                404
              </h1>
            </div>
          </div>
        </div>

        <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
          Page not found
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Sorry, we couldn't find the page you're looking for. Perhaps you've mistyped the URL?
          Be sure to check your spelling.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go back
          </button>

          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <Home className="mr-2 h-5 w-5" />
            Go to Homepage
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500">
            <Link
              href="/help"
              className="hover:text-purple-600 transition-colors duration-200"
            >
              Help Center
            </Link>
            <Link
              href="/contact"
              className="hover:text-purple-600 transition-colors duration-200"
            >
              Contact Support
            </Link>
            <Link
              href="/status"
              className="hover:text-purple-600 transition-colors duration-200"
            >
              System Status
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <form className="max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <input
                type="search"
                placeholder="Search our site..."
                className="w-full px-4 py-3 pl-12 pr-4 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}