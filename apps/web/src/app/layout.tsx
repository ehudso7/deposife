import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Deposife - Secure Deposit Protection Platform',
  description: 'Advanced tenant deposit protection platform with legal compliance, dispute resolution, and automated deposit management',
  keywords: 'tenant deposit, deposit protection, rental deposit, security deposit, landlord, tenant, property management',
  authors: [{ name: 'Deposife' }],
  creator: 'Deposife',
  publisher: 'Deposife',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://deposife.com'),
  openGraph: {
    title: 'Deposife',
    description: 'Secure your rental deposits with advanced protection and dispute resolution',
    url: '/',
    siteName: 'Deposife',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Deposife',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deposife',
    description: 'Secure your rental deposits with advanced protection',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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