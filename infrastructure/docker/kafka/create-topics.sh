#!/bin/bash

# Wait for Kafka to be ready
sleep 10

# Create all topics
kafka-topics.sh --create --if-not-exists --topic workflow.process.started --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.process.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.process.failed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.task.created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.task.assigned --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.task.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.task.failed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.transition.triggered --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

kafka-topics.sh --create --if-not-exists --topic rules.evaluation.requested --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.evaluation.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.evaluation.failed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.rule.created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.rule.updated --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.rule.deleted --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.condition.evaluated --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.action.executed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

kafka-topics.sh --create --if-not-exists --topic gateway.query.received --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.query.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.mutation.received --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.mutation.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.federation.error --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.auth.failed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.rate.limited --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

echo "All Kafka topics created successfully"
