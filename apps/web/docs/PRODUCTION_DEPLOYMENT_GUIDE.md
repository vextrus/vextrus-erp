# Production Deployment Guide

## Prerequisites
- Node.js 20+
- pnpm 8+
- Environment variables configured

## Environment Variables
```bash
# Required
NEXT_PUBLIC_API_URL=https://api.vextrus.com/graphql
NEXT_PUBLIC_WS_URL=wss://api.vextrus.com/graphql

# Optional
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_GA_ID=G-...
```

## Build Process
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run quality checks
pnpm --filter @vextrus/web type-check
pnpm --filter @vextrus/web lint
pnpm --filter @vextrus/web test:run

# Build for production
pnpm --filter @vextrus/web build

# Start production server
pnpm --filter @vextrus/web start
```

## Performance Checklist
- [ ] Bundle size < 200KB First Load JS
- [ ] Lighthouse score > 95
- [ ] Core Web Vitals in "Good" range
- [ ] Images optimized (WebP/AVIF)
- [ ] Code splitting implemented
- [ ] Lazy loading enabled

## Monitoring
- [ ] Sentry configured for error tracking
- [ ] Web Vitals reporting to analytics
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured

## Rollback Plan
If issues occur in production:
1. Revert to previous deployment
2. Check Sentry for errors
3. Review Lighthouse reports
4. Test in staging environment
