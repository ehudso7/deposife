import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Deposife - Secure Deposit Protection Platform',
    template: '%s | Deposife',
  },
  description: 'Advanced tenant deposit protection platform with secure escrow, automated compliance, fair dispute resolution, and comprehensive property management tools for landlords and tenants.',
  keywords: [
    'tenant deposit',
    'deposit protection',
    'rental deposit',
    'security deposit',
    'landlord',
    'tenant',
    'property management',
    'escrow service',
    'dispute resolution',
    'rental protection',
    'deposit scheme',
    'tenancy deposit',
    'property rental',
    'lease management',
  ].join(', '),
  authors: [
    { name: 'Deposife', url: 'https://deposife.com' }
  ],
  creator: 'Deposife',
  publisher: 'Deposife',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://deposife.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'en-GB': '/en-GB',
    },
  },
  openGraph: {
    title: 'Deposife - Secure Deposit Protection Platform',
    description: 'Protect your rental deposits with our advanced platform. Secure escrow, automated compliance, and fair dispute resolution for landlords and tenants.',
    url: '/',
    siteName: 'Deposife',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Deposife - Secure Deposit Protection',
      },
      {
        url: '/og-image-square.png',
        width: 1200,
        height: 1200,
        alt: 'Deposife - Secure Deposit Protection',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deposife - Secure Deposit Protection',
    description: 'Protect your rental deposits with our advanced platform. Secure escrow, automated compliance, and fair dispute resolution.',
    creator: '@deposife',
    site: '@deposife',
    images: {
      url: '/twitter-image.png',
      alt: 'Deposife - Secure Deposit Protection',
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
        <Providers>
          {children}
          <Toaster
            richColors
            position="bottom-right"
            expand={false}
            closeButton
          />
        </Providers>
      </body>
    </html>
  );
}