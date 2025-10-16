#!/bin/bash

# Script to create Kafka topics for all infrastructure services

KAFKA_CONTAINER="vextrus-kafka"
KAFKA_BOOTSTRAP="kafka:9092"

echo "Creating Kafka topics for infrastructure services..."
echo ""

# Function to create a topic
create_topic() {
  local topic_name=$1
  local partitions=${2:-3}
  local replication=${3:-1}

  echo "Creating topic: $topic_name (partitions: $partitions, replication: $replication)"

  docker exec $KAFKA_CONTAINER kafka-topics \
    --bootstrap-server $KAFKA_BOOTSTRAP \
    --create \
    --topic $topic_name \
    --partitions $partitions \
    --replication-factor $replication \
    --if-not-exists 2>/dev/null || echo "  Topic may already exist or Kafka is not running"
}

# Audit Service Topics
echo "=== Audit Service Topics ==="
create_topic "audit.events" 6 1
create_topic "audit.compliance.alerts" 3 1
create_topic "audit.logs.archived" 3 1
create_topic "audit.dlq" 1 1

echo ""

# Notification Service Topics
echo "=== Notification Service Topics ==="
create_topic "notification.email" 3 1
create_topic "notification.sms" 3 1
create_topic "notification.push" 3 1
create_topic "notification.webhook" 3 1
create_topic "notification.status" 3 1
create_topic "notification.failed" 1 1
create_topic "notification.dlq" 1 1

echo ""

# File Storage Service Topics
echo "=== File Storage Service Topics ==="
create_topic "file.uploaded" 3 1
create_topic "file.deleted" 3 1
create_topic "file.scanned" 3 1
create_topic "file.virus.detected" 1 1
create_topic "file.processing" 3 1
create_topic "file.dlq" 1 1

echo ""

# Document Generator Service Topics
echo "=== Document Generator Service Topics ==="
create_topic "document.generate.request" 3 1
create_topic "document.generate.complete" 3 1
create_topic "document.generate.failed" 1 1
create_topic "document.template.updated" 1 1
create_topic "document.dlq" 1 1

echo ""

# Scheduler Service Topics
echo "=== Scheduler Service Topics ==="
create_topic "scheduler.job.created" 3 1
create_topic "scheduler.job.executed" 6 1
create_topic "scheduler.job.failed" 3 1
create_topic "scheduler.job.completed" 3 1
create_topic "scheduler.cron.trigger" 3 1
create_topic "scheduler.dlq" 1 1

echo ""

# Configuration Service Topics
echo "=== Configuration Service Topics ==="
create_topic "config.changed" 3 1
create_topic "config.feature.toggled" 3 1
create_topic "config.reload" 1 1
create_topic "config.sync" 1 1
create_topic "config.dlq" 1 1

echo ""

# Import/Export Service Topics
echo "=== Import/Export Service Topics ==="
create_topic "import.job.started" 3 1
create_topic "import.job.completed" 3 1
create_topic "import.job.failed" 3 1
create_topic "import.record.processed" 6 1
create_topic "export.job.started" 3 1
create_topic "export.job.completed" 3 1
create_topic "export.job.failed" 3 1
create_topic "import-export.dlq" 1 1

echo ""

# Cross-Service Event Topics
echo "=== Cross-Service Event Topics ==="
create_topic "tenant.events" 3 1
create_topic "system.events" 3 1
create_topic "security.events" 3 1
create_topic "integration.events" 3 1

echo ""
echo "Done! All Kafka topics have been created."
echo ""
echo "To list all topics:"
echo "  docker exec $KAFKA_CONTAINER kafka-topics --bootstrap-server $KAFKA_BOOTSTRAP --list"
echo ""
echo "To describe a topic:"
echo "  docker exec $KAFKA_CONTAINER kafka-topics --bootstrap-server $KAFKA_BOOTSTRAP --describe --topic <topic-name>"