export class PerformanceMonitor {
  private static instance: PerformanceMonitor

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  measurePageLoad(pageName: string) {
    if (typeof window === 'undefined') return

    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    const metrics = {
      page: pageName,
      ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
      fcp: 0, // Will be updated by web-vitals
      lcp: 0, // Will be updated by web-vitals
      domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
      loadComplete: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
    }

    console.log('Page Load Metrics:', metrics)

    // Send to analytics
    this.sendToAnalytics('page_load', metrics)
  }

  measureApiCall(endpoint: string, duration: number, status: number) {
    const metrics = {
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString(),
    }

    console.log('API Call Metrics:', metrics)

    // Send to analytics
    this.sendToAnalytics('api_call', metrics)
  }

  private sendToAnalytics(event: string, data: any) {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as any).gtag('event', event, data)
    }
  }
}
