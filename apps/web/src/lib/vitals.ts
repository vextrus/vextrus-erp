import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

type MetricName = 'CLS' | 'FCP' | 'LCP' | 'TTFB' | 'INP'

interface Metric {
  name: MetricName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

function sendToAnalytics(metric: Metric) {
  // Send to your analytics service
  console.log('Web Vital:', metric)

  // Future: Send to real monitoring service
  if (typeof window !== 'undefined' && 'gtag' in window) {
    ;(window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    })
  }
}

export function registerWebVitals() {
  onCLS(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
  onINP(sendToAnalytics)
}
