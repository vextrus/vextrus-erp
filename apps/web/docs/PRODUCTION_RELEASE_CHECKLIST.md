# Production Release Checklist

## Pre-Release
- [ ] All tests passing (unit, integration, E2E)
- [ ] Lighthouse score > 95
- [ ] Accessibility tests passing (WCAG 2.1 AA)
- [ ] Bundle size within limits
- [ ] No console errors or warnings
- [ ] Performance benchmarks met
- [ ] Security audit passed

## Deployment
- [ ] Environment variables configured
- [ ] Database migrations run (if applicable)
- [ ] CDN cache cleared
- [ ] DNS records updated (if needed)
- [ ] SSL certificate valid

## Post-Release
- [ ] Smoke tests passed
- [ ] Error tracking active
- [ ] Performance metrics normal
- [ ] User feedback collected
- [ ] Documentation updated

## Rollback Criteria
Roll back if:
- Error rate > 5%
- Performance degradation > 20%
- Critical accessibility issues
- Security vulnerabilities discovered
