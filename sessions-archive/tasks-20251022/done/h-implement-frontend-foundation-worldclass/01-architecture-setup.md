---
task: h-implement-frontend-foundation-worldclass/01-architecture-setup
branch: feature/frontend-foundation-worldclass
status: pending
created: 2025-09-29
modules: [web, ui-components, design-system]
phase: 1
duration: Week 1-2
---

# Phase 1: Architecture & Setup

## Objective
Establish Next.js 14.2+ foundation with App Router, Tailwind CSS configuration, and core infrastructure for the Vextrus Vision theme with glassmorphism design principles.

## Success Criteria
- [ ] Next.js 14.2+ with App Router configured
- [ ] Tailwind CSS with custom Vextrus Vision theme
- [ ] TypeScript strict mode enabled
- [ ] ESLint and Prettier configured
- [ ] Husky pre-commit hooks setup
- [ ] Storybook for component development
- [ ] Testing infrastructure ready
- [ ] PWA configuration complete
- [ ] Performance monitoring setup

## Technical Implementation

### 1. Next.js Project Setup
```bash
# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest vextrus-web --typescript --tailwind --app --eslint
cd vextrus-web

# Install core dependencies
pnpm add @radix-ui/themes @radix-ui/colors @radix-ui/icons
pnpm add framer-motion @react-spring/web
pnpm add react-hook-form zod @hookform/resolvers
pnpm add @tanstack/react-query @tanstack/react-table
pnpm add recharts react-chartjs-2 chart.js
pnpm add date-fns react-day-picker
pnpm add react-hot-toast sonner
pnpm add clsx tailwind-merge class-variance-authority

# Development dependencies
pnpm add -D @types/node @types/react @types/react-dom
pnpm add -D @storybook/nextjs @storybook/addon-essentials
pnpm add -D @testing-library/react @testing-library/jest-dom jest
pnpm add -D cypress @cypress/react @cypress/webpack-dev-server
pnpm add -D husky lint-staged prettier eslint-config-prettier
```

### 2. Project Structure
```typescript
/apps/web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth group routes
│   │   ├── (dashboard)/          # Dashboard group routes
│   │   ├── api/                  # API routes
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── input/
│   │   │   └── modal/
│   │   ├── features/            # Feature components
│   │   ├── layouts/             # Layout components
│   │   └── providers/           # Context providers
│   ├── lib/                     # Utility functions
│   │   ├── api/                 # API clients
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # Helper functions
│   │   └── validators/          # Zod schemas
│   ├── styles/                  # Style system
│   │   ├── themes/              # Theme configurations
│   │   └── tokens/              # Design tokens
│   └── types/                   # TypeScript types
├── public/                      # Static assets
├── tests/                       # Test files
└── stories/                     # Storybook stories
```

### 3. Tailwind Configuration with Vextrus Vision Theme
```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@radix-ui/themes/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vextrus Brand Colors
        vextrus: {
          navy: {
            50: '#E6E9F0',
            100: '#C0C8DC',
            200: '#9AA6C7',
            300: '#7485B3',
            400: '#4E649E',
            500: '#1E3A8A', // Primary
            600: '#1A3276',
            700: '#162A63',
            800: '#12224F',
            900: '#0E1A3B',
          },
          emerald: {
            50: '#E6F9F0',
            100: '#C0F0D9',
            200: '#99E7C2',
            300: '#73DEAB',
            400: '#4DD594',
            500: '#10B981', // Accent
            600: '#0E9F6E',
            700: '#0C855C',
            800: '#0A6B4A',
            900: '#085138',
          },
          silver: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#E5E5E5',
            300: '#D4D4D4',
            400: '#A3A3A3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          },
        },
        // Semantic Colors
        background: {
          DEFAULT: 'hsl(var(--background))',
          secondary: 'hsl(var(--background-secondary))',
          tertiary: 'hsl(var(--background-tertiary))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          secondary: 'hsl(var(--foreground-secondary))',
          tertiary: 'hsl(var(--foreground-tertiary))',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          heavy: 'rgba(255, 255, 255, 0.3)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        display: ['var(--font-poppins)', ...fontFamily.sans],
        mono: ['var(--font-jetbrains-mono)', ...fontFamily.mono],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-vextrus': 'linear-gradient(135deg, #1E3A8A 0%, #10B981 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.8)' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.25)',
        'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.45)',
        'glow': '0 0 20px rgba(16, 185, 129, 0.5)',
        'glow-lg': '0 0 40px rgba(16, 185, 129, 0.8)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    require('tailwindcss-animate'),
    // Custom glassmorphism plugin
    function({ addUtilities }) {
      addUtilities({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      })
    },
  ],
}

export default config
```

### 4. Next.js Configuration
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  experimental: {
    optimizeCss: true,
    serverActions: true,
    typedRoutes: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    domains: ['localhost', 'api.vextrus.com'],
    formats: ['image/avif', 'image/webp'],
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
}

module.exports = withPWA(nextConfig)
```

### 5. TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/types/*": ["./src/types/*"],
      "@/hooks/*": ["./src/lib/hooks/*"],
      "@/utils/*": ["./src/lib/utils/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "src/**/*"
  ],
  "exclude": ["node_modules"]
}
```

### 6. Global Styles with Glassmorphism
```css
/* src/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --background-secondary: 220 14% 96%;
    --background-tertiary: 220 13% 91%;
    --foreground: 222 84% 5%;
    --foreground-secondary: 220 9% 46%;
    --foreground-tertiary: 220 8% 61%;

    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;

    --secondary: 158 64% 52%;
    --secondary-foreground: 0 0% 100%;

    --accent: 158 64% 52%;
    --accent-foreground: 0 0% 100%;

    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 53%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222 47% 11%;
    --background-secondary: 217 33% 17%;
    --background-tertiary: 215 28% 23%;
    --foreground: 210 40% 98%;
    --foreground-secondary: 215 20% 65%;
    --foreground-tertiary: 217 19% 45%;

    --primary: 221 83% 53%;
    --primary-foreground: 222 47% 11%;

    --secondary: 158 64% 52%;
    --secondary-foreground: 222 47% 11%;

    --border: 217 33% 17%;
    --input: 217 33% 17%;
  }
}

@layer utilities {
  /* Glassmorphism Effects */
  .glass-effect {
    @apply bg-white/10 backdrop-blur-md border border-white/20;
  }

  .glass-effect-dark {
    @apply bg-black/10 backdrop-blur-md border border-white/10;
  }

  .glass-card {
    @apply glass-effect rounded-2xl p-6 shadow-glass;
  }

  .glass-button {
    @apply glass-effect px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-300;
  }

  /* Gradient Text */
  .gradient-text {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-vextrus-navy-500 to-vextrus-emerald-500;
  }

  /* Animated Background */
  .animated-bg {
    background: linear-gradient(-45deg, #1e3a8a, #10b981, #1e3a8a, #10b981);
    background-size: 400% 400%;
    animation: gradient-xy 15s ease infinite;
  }

  /* Neon Glow */
  .neon-glow {
    text-shadow:
      0 0 10px rgba(16, 185, 129, 0.5),
      0 0 20px rgba(16, 185, 129, 0.3),
      0 0 30px rgba(16, 185, 129, 0.2);
  }

  /* Smooth Scroll */
  .smooth-scroll {
    scroll-behavior: smooth;
    scroll-padding-top: 80px;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply bg-vextrus-silver-400 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-vextrus-silver-500;
}

/* Loading Skeleton */
.skeleton {
  @apply animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%];
}

/* Focus Styles */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-vextrus-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900;
}
```

### 7. Root Layout with Theme Provider
```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@/components/analytics'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-poppins',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Vextrus ERP - Enterprise Resource Planning for Bangladesh',
  description: 'Next-generation ERP system designed for Bangladesh construction and real estate industry',
  keywords: ['ERP', 'Bangladesh', 'Construction', 'Real Estate', 'Enterprise Software'],
  authors: [{ name: 'Vextrus Technologies' }],
  creator: 'Vextrus Technologies',
  publisher: 'Vextrus Technologies',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://vextrus.com'),
  openGraph: {
    title: 'Vextrus ERP',
    description: 'Enterprise Resource Planning for Bangladesh',
    url: 'https://vextrus.com',
    siteName: 'Vextrus ERP',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vextrus ERP',
    description: 'Enterprise Resource Planning for Bangladesh',
    images: ['/twitter-image.png'],
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1E3A8A' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1A3B' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
            <Analytics />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 8. Performance Monitoring Setup
```typescript
// src/components/analytics.tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Web Vitals monitoring
    if (typeof window !== 'undefined' && 'web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(sendToAnalytics)
        getFID(sendToAnalytics)
        getFCP(sendToAnalytics)
        getLCP(sendToAnalytics)
        getTTFB(sendToAnalytics)
      })
    }
  }, [pathname, searchParams])

  return null
}

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
  })

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body)
  } else {
    fetch('/api/analytics', {
      body,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    })
  }
}
```

### 9. Storybook Configuration
```javascript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-coverage',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
}

export default config
```

### 10. Testing Setup
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

## Environment Configuration
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Quality Assurance

### Performance Metrics
- [ ] Lighthouse score > 98
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Bundle size < 200KB (initial)

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation support
- [ ] Screen reader compatible
- [ ] Color contrast ratios met
- [ ] Focus indicators visible

### Browser Support
- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+
- [ ] Mobile browsers

## Validation Checklist

- [ ] Project builds without errors
- [ ] TypeScript strict mode passing
- [ ] ESLint no errors
- [ ] All imports resolved
- [ ] Tailwind classes working
- [ ] Dark mode toggle functional
- [ ] PWA installable
- [ ] Storybook running
- [ ] Tests passing
- [ ] Performance benchmarks met

## Next Phase Dependencies

This foundation enables:
- Core component development (Phase 2)
- Dashboard implementation (Phase 3)
- Integration layer (Phase 4)
- Testing and optimization (Phase 5)

## Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com/)