import { SpanKind, SpanStatusCode } from '@opentelemetry/api';

export interface ObservabilityConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  otlpEndpoint?: string;
  enableTracing?: boolean;
  enableMetrics?: boolean;
  enableLogging?: boolean;
  samplingRate?: number;
}

export interface SpanMetadata {
  name: string;
  kind?: SpanKind;
  attributes?: Record<string, any>;
  parentSpanId?: string;
  traceId?: string;
}

export interface MetricMetadata {
  name: string;
  type: 'counter' | 'histogram' | 'gauge';
  unit?: string;
  description?: string;
  labels?: Record<string, any>;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags?: number;
  traceState?: string;
}

export interface PropagationHeaders {
  traceparent: string;
  tracestate?: string;
  baggage?: string;
}

export interface InstrumentationOptions {
  http?: boolean;
  grpc?: boolean;
  database?: boolean;
  redis?: boolean;
  kafka?: boolean;
  custom?: string[];
}

export interface ObservabilityMiddleware {
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface TracingConfig {
  exporter: 'otlp' | 'jaeger' | 'zipkin' | 'console';
  endpoint?: string;
  headers?: Record<string, string>;
  samplingRate?: number;
  propagators?: string[];
}

export interface MetricsConfig {
  exporter: 'otlp' | 'prometheus' | 'console';
  endpoint?: string;
  headers?: Record<string, string>;
  interval?: number;
  aggregationTemporality?: 'cumulative' | 'delta';
}

export interface LoggingConfig {
  exporter: 'otlp' | 'console' | 'file';
  endpoint?: string;
  headers?: Record<string, string>;
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

export interface ObservabilityContext {
  traceId?: string;
  spanId?: string;
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  requestId?: string;
}

export interface SpanEvent {
  name: string;
  timestamp?: number;
  attributes?: Record<string, any>;
}

export interface MetricValue {
  value: number;
  timestamp?: number;
  labels?: Record<string, any>;
}