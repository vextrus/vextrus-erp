import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { CompositePropagator, W3CBaggagePropagator } from '@opentelemetry/core';

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  otlpEndpoint?: string;
  otlpHeaders?: string;
  metricsInterval?: number;
  enableConsoleExporter?: boolean;
}

/**
 * Initialize OpenTelemetry SDK with standardized configuration
 */
export function initializeTelemetry(config: TelemetryConfig): NodeSDK {
  const {
    serviceName,
    serviceVersion = '1.0.0',
    environment = 'development',
    otlpEndpoint = 'http://localhost:4317',
    otlpHeaders,
    metricsInterval = 10000,
    enableConsoleExporter = false,
  } = config;

  // Create resource with service information
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'vextrus',
      [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: `${serviceName}-${process.pid}`,
    }),
  );

  // Configure trace exporter
  const traceExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
    headers: otlpHeaders ? JSON.parse(otlpHeaders) : undefined,
  });

  // Configure metrics exporter
  const metricExporter = new OTLPMetricExporter({
    url: otlpEndpoint,
    headers: otlpHeaders ? JSON.parse(otlpHeaders) : undefined,
  });

  // Create SDK with auto-instrumentation
  const sdk = new NodeSDK({
    resource,
    traceExporter: traceExporter as any,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: metricsInterval,
    }) as any,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable fs instrumentation to reduce noise
        },
        '@opentelemetry/instrumentation-http': {
          requestHook: (span, request: any) => {
            // Add custom attributes to HTTP spans
            span.setAttributes({
              'http.request.body.size': request.headers?.['content-length'] || 0,
            });
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

  // Add shutdown handler
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK terminated successfully'))
      .catch((error) => console.error('Error terminating SDK', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

/**
 * Standard telemetry initialization for services
 */
export function setupServiceTelemetry(serviceName: string): NodeSDK {
  const config: TelemetryConfig = {
    serviceName,
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
    otlpHeaders: process.env.OTEL_EXPORTER_OTLP_HEADERS,
    metricsInterval: parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || '10000'),
    enableConsoleExporter: process.env.OTEL_CONSOLE_EXPORTER === 'true',
  };

  const sdk = initializeTelemetry(config);
  sdk.start();
  
  console.log(`OpenTelemetry initialized for ${serviceName}`);
  
  return sdk;
}