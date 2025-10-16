import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Vextrus ERP | Enterprise Resource Planning',
    template: '%s | Vextrus ERP',
  },
  description: 'World-class Enterprise Resource Planning system for Bangladesh Construction & Real Estate',
  keywords: ['ERP', 'Construction', 'Real Estate', 'Bangladesh', 'Enterprise'],
  authors: [{ name: 'Vextrus' }],
  creator: 'Vextrus',
  publisher: 'Vextrus',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Vextrus ERP',
    description: 'World-class Enterprise Resource Planning system',
    siteName: 'Vextrus ERP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vextrus ERP',
    description: 'World-class Enterprise Resource Planning system',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to API Gateway */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />

        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/NotoSansBengali-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}