/**
 * OpenTelemetry semantic conventions and constants
 */

export const TRACE_HEADERS = {
  TRACEPARENT: 'traceparent',
  TRACESTATE: 'tracestate',
  BAGGAGE: 'baggage',
} as const;

export const CUSTOM_HEADERS = {
  TRACE_ID: 'x-trace-id',
  SPAN_ID: 'x-span-id',
  PARENT_SPAN_ID: 'x-parent-span-id',
  SERVICE_NAME: 'x-service-name',
  SERVICE_VERSION: 'x-service-version',
  CORRELATION_ID: 'x-correlation-id',
  REQUEST_ID: 'x-request-id',
  USER_ID: 'x-user-id',
  TENANT_ID: 'x-tenant-id',
} as const;

export const SPAN_ATTRIBUTES = {
  // HTTP attributes
  HTTP_METHOD: 'http.method',
  HTTP_URL: 'http.url',
  HTTP_TARGET: 'http.target',
  HTTP_HOST: 'http.host',
  HTTP_SCHEME: 'http.scheme',
  HTTP_STATUS_CODE: 'http.status_code',
  HTTP_USER_AGENT: 'http.user_agent',
  HTTP_REQUEST_CONTENT_LENGTH: 'http.request_content_length',
  HTTP_RESPONSE_CONTENT_LENGTH: 'http.response_content_length',
  
  // Network attributes
  NET_HOST_NAME: 'net.host.name',
  NET_HOST_PORT: 'net.host.port',
  NET_PEER_NAME: 'net.peer.name',
  NET_PEER_PORT: 'net.peer.port',
  NET_TRANSPORT: 'net.transport',
  
  // Database attributes
  DB_SYSTEM: 'db.system',
  DB_NAME: 'db.name',
  DB_STATEMENT: 'db.statement',
  DB_OPERATION: 'db.operation',
  DB_USER: 'db.user',
  
  // Message attributes
  MESSAGING_SYSTEM: 'messaging.system',
  MESSAGING_DESTINATION: 'messaging.destination',
  MESSAGING_DESTINATION_KIND: 'messaging.destination_kind',
  MESSAGING_OPERATION: 'messaging.operation',
  MESSAGING_MESSAGE_ID: 'messaging.message_id',
  
  // Custom attributes
  USER_ID: 'user.id',
  USER_EMAIL: 'user.email',
  TENANT_ID: 'tenant.id',
  ORGANIZATION_ID: 'organization.id',
  CORRELATION_ID: 'correlation.id',
  REQUEST_ID: 'request.id',
  
  // Error attributes
  ERROR_TYPE: 'error.type',
  ERROR_MESSAGE: 'error.message',
  ERROR_STACK: 'error.stack',
} as const;

export const METRIC_NAMES = {
  // HTTP metrics
  HTTP_REQUEST_DURATION: 'http.request.duration',
  HTTP_REQUEST_SIZE: 'http.request.size',
  HTTP_RESPONSE_SIZE: 'http.response.size',
  HTTP_ACTIVE_REQUESTS: 'http.active_requests',
  
  // Database metrics
  DB_QUERY_DURATION: 'db.query.duration',
  DB_CONNECTION_POOL_SIZE: 'db.connection.pool.size',
  DB_CONNECTION_POOL_ACTIVE: 'db.connection.pool.active',
  
  // Business metrics
  USER_LOGIN_ATTEMPTS: 'user.login.attempts',
  USER_LOGIN_SUCCESS: 'user.login.success',
  USER_LOGIN_FAILURE: 'user.login.failure',
  USER_SESSIONS_ACTIVE: 'user.sessions.active',
  
  // System metrics
  PROCESS_CPU_USAGE: 'process.cpu.usage',
  PROCESS_MEMORY_USAGE: 'process.memory.usage',
  PROCESS_UPTIME: 'process.uptime',
} as const;

export const DEFAULT_CONFIG = {
  OTLP_ENDPOINT: 'http://localhost:4317',
  METRICS_INTERVAL: 10000,
  SAMPLING_RATE: 1.0,
  MAX_TRACE_EXPORT_BATCH_SIZE: 512,
  TRACE_EXPORT_TIMEOUT_MS: 30000,
  MAX_METRIC_EXPORT_BATCH_SIZE: 512,
  METRIC_EXPORT_TIMEOUT_MS: 30000,
} as const;

export const SERVICE_NAMESPACE = 'vextrus';

export const PROPAGATION_FORMATS = {
  W3C_TRACE_CONTEXT: 'w3c-trace-context',
  W3C_BAGGAGE: 'w3c-baggage',
  B3: 'b3',
  B3_MULTI: 'b3-multi',
  JAEGER: 'jaeger',
} as const;