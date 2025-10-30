-- Event Store Table for storing all domain events
CREATE TABLE IF NOT EXISTS event_store (
  id BIGSERIAL PRIMARY KEY,
  stream_id VARCHAR(255) NOT NULL,
  stream_version INT NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  correlation_id VARCHAR(255),
  causation_id VARCHAR(255),
  CONSTRAINT unique_stream_version UNIQUE(stream_id, stream_version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_store_stream ON event_store(stream_id);
CREATE INDEX IF NOT EXISTS idx_event_store_correlation ON event_store(correlation_id);
CREATE INDEX IF NOT EXISTS idx_event_store_created_at ON event_store(created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_type ON event_store(event_type);

-- Saga State Table for orchestration
CREATE TABLE IF NOT EXISTS saga_state (
  id VARCHAR(255) PRIMARY KEY,
  saga_type VARCHAR(255) NOT NULL,
  current_state VARCHAR(100) NOT NULL,
  saga_data JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  correlation_id VARCHAR(255),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_saga_state_correlation ON saga_state(correlation_id);
CREATE INDEX IF NOT EXISTS idx_saga_state_type ON saga_state(saga_type);
CREATE INDEX IF NOT EXISTS idx_saga_state_status ON saga_state(current_state);

-- Outbox Pattern Table for reliable event publishing
CREATE TABLE IF NOT EXISTS outbox_events (
  id BIGSERIAL PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER')),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_aggregate ON outbox_events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_outbox_retry ON outbox_events(status, next_retry_at) WHERE status IN ('PENDING', 'FAILED');

-- Idempotency Table for preventing duplicate operations
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  request_hash VARCHAR(64) NOT NULL,
  response JSONB,
  status VARCHAR(20) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_status ON idempotency_keys(status, created_at);

-- Snapshots Table for event sourcing optimization
CREATE TABLE IF NOT EXISTS event_snapshots (
  stream_id VARCHAR(255) NOT NULL,
  stream_version INT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (stream_id, stream_version)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_stream ON event_snapshots(stream_id);

-- Function to clean up expired idempotency keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update saga_state updated_at timestamp
CREATE OR REPLACE FUNCTION update_saga_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saga_timestamp
  BEFORE UPDATE ON saga_state
  FOR EACH ROW
  EXECUTE FUNCTION update_saga_updated_at();