import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { CompositePropagator, W3CTraceContextPropagator, W3CBaggagePropagator } from '@opentelemetry/core';
import { IncomingMessage } from 'http';

export const initTelemetry = () => {
  // Set semantic convention stability opt-in for migration period
  process.env.OTEL_SEMCONV_STABILITY_OPT_IN = 'http/dup';

  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'auth-service',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      'service.namespace': 'vextrus-erp',
      'service.instance.id': process.env.HOSTNAME || 'local',
    }),
  );

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : {},
  });

  const metricExporter = new OTLPMetricExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : {},
  });

  const sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter) as any, // Type workaround for version mismatch
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL) || 10000,
    }) as any, // Type workaround for version mismatch
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          requestHook: (span, request) => {
            // Type guard to ensure we're working with IncomingMessage (server requests)
            const incomingRequest = request as IncomingMessage;
            if (incomingRequest.headers) {
              if (incomingRequest.headers['x-tenant-id']) {
                span.setAttribute('tenant.id', incomingRequest.headers['x-tenant-id'] as string);
              }
              if (incomingRequest.headers['x-project-id']) {
                span.setAttribute('project.id', incomingRequest.headers['x-project-id'] as string);
              }
              if (incomingRequest.headers['x-site-id']) {
                span.setAttribute('site.id', incomingRequest.headers['x-site-id'] as string);
              }
              if (incomingRequest.headers['x-user-id']) {
                span.setAttribute('user.id', incomingRequest.headers['x-user-id'] as string);
              }
            }
          },
          ignoreIncomingRequestHook: (request) => {
            const ignorePaths = ['/health', '/health/ready', '/health/live', '/metrics'];
            return ignorePaths.some(path => request.url?.includes(path));
          },
        },
        '@opentelemetry/instrumentation-express': {
          requestHook: (span, { request }) => {
            span.setAttribute('http.route', request.route?.path || 'unknown');
          },
        },
        '@opentelemetry/instrumentation-pg': {
          enhancedDatabaseReporting: true,
          responseHook: (span, info) => {
            // Handle the response safely with proper typing
            if (info && typeof info === 'object' && 'response' in info) {
              const response = (info as any).response;
              if (response?.rowCount) {
                span.setAttribute('db.rows_affected', response.rowCount);
              }
            }
          },
        },
      }),
    ],
    textMapPropagator: new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator(),
      ],
    }),
  });

  // Handle graceful shutdown
  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.once(signal, async () => {
      try {
        await sdk.shutdown();
        console.log('OpenTelemetry SDK shut down successfully');
      } catch (error: any) {
        console.error('Error shutting down OpenTelemetry SDK', error);
      } finally {
        process.exit(0);
      }
    });
  });

  sdk.start();
  console.log('OpenTelemetry SDK initialized successfully');
  
  return sdk;
};