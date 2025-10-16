import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

/**
 * OpenTelemetry Configuration for Master Data Service
 *
 * Provides distributed tracing and observability for:
 * - HTTP requests (REST and GraphQL)
 * - Database queries (PostgreSQL via TypeORM)
 * - Cache operations (Redis)
 * - Event publishing (Kafka)
 */

const serviceName = process.env.OTEL_SERVICE_NAME || 'master-data-service';
const serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
const environment = process.env.NODE_ENV || 'development';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

// Create resource with service information
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
});

// Configure OTLP trace exporter
const traceExporter = new OTLPTraceExporter({
  url: otlpEndpoint,
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
    : {},
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Automatically instrument common libraries
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingPaths: ['/health', '/metrics'], // Don't trace health checks
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-graphql': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
    }),
  ],
});

/**
 * Start OpenTelemetry SDK
 * Call this before application initialization
 */
export function startTelemetry(): void {
  try {
    sdk.start();
    console.log('[Telemetry] OpenTelemetry SDK initialized successfully');
    console.log(`[Telemetry] Service: ${serviceName}`);
    console.log(`[Telemetry] Version: ${serviceVersion}`);
    console.log(`[Telemetry] Environment: ${environment}`);
    console.log(`[Telemetry] Exporter: ${otlpEndpoint}`);
  } catch (error) {
    console.error('[Telemetry] Failed to initialize OpenTelemetry SDK:', error);
  }
}

/**
 * Shutdown OpenTelemetry SDK
 * Call this during graceful shutdown
 */
export async function shutdownTelemetry(): Promise<void> {
  try {
    await sdk.shutdown();
    console.log('[Telemetry] OpenTelemetry SDK shutdown successfully');
  } catch (error) {
    console.error('[Telemetry] Error during OpenTelemetry shutdown:', error);
  }
}

/**
 * Enable graceful shutdown on process termination
 */
process.on('SIGTERM', async () => {
  await shutdownTelemetry();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownTelemetry();
  process.exit(0);
});
